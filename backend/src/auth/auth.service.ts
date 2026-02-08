import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import admin, { isFirebaseMockMode } from '../firebase/firebase.config';

interface FirebaseTokenPayload {
    uid: string;
    email: string;
    name?: string;
    picture?: string;
}

interface SessionTokenPayload {
    sub: string; // platform_user.id (UUID)
    customUid: string; // AUxxxxxx
    email: string;
    isGod: boolean;
}

interface SignUpDto {
    name: string;
    email: string;
    mobile?: string;
    password: string;
}

interface LoginDto {
    customUid: string;
    password: string;
}

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    /**
     * Generate unique custom UID in format AUxxxxxx
     */
    private async generateCustomUid(): Promise<string> {
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
            // Generate 6-digit random number
            const randomNum = Math.floor(100000 + Math.random() * 900000);
            const customUid = `AU${randomNum}`;

            // Check if it exists
            const existing = await this.prisma.platformUser.findUnique({
                where: { customUid },
            });

            if (!existing) {
                return customUid;
            }

            attempts++;
        }

        throw new Error('Failed to generate unique custom UID');
    }

    /**
     * SIGN UP: Create new user with custom UID
     */
    async signUp(data: SignUpDto): Promise<{
        customUid: string;
        email: string;
        message: string;
    }> {
        // 1. Check if email already exists
        const existingUser = await this.prisma.platformUser.findUnique({
            where: { email: data.email.toLowerCase() },
        });

        // Check if verify seeded user (placeholder UID)
        const isSeededAdmin = existingUser && existingUser.firebaseUid === 'alpherymail-default-uid';

        if (existingUser && !isSeededAdmin) {
            throw new ConflictException('Email already registered');
        }

        // 2. Create or Get Firebase user
        let firebaseUser;
        try {
            firebaseUser = await admin.auth().createUser({
                email: data.email.toLowerCase(),
                password: data.password,
                displayName: data.name,
            });
        } catch (error: any) {
            if (error.code === 'auth/email-already-exists') {
                try {
                    firebaseUser = await admin.auth().getUserByEmail(data.email.toLowerCase());
                    await admin.auth().updateUser(firebaseUser.uid, {
                        password: data.password,
                        displayName: data.name
                    });
                } catch (fetchError) {
                    console.error('[AUTH] Failed to fetch existing Firebase user:', fetchError);
                    throw new BadRequestException('Account issue. Please contact support.');
                }
            } else {
                console.error('[AUTH] Firebase user creation failed:', error);
                throw new BadRequestException('Failed to create user account');
            }
        }

        // 3. Create or Update Platform User
        let platformUser;
        let customUid;

        if (isSeededAdmin && existingUser) {
            // Update seeded user logic
            try {
                platformUser = await this.prisma.platformUser.update({
                    where: { id: existingUser.id },
                    data: {
                        firebaseUid: firebaseUser.uid,
                        displayName: data.name,
                        mobile: data.mobile || null,
                        isActive: true
                    }
                });
                customUid = platformUser.customUid;
            } catch (error) {
                // Rollback firebase user? No, just fail.
                console.error('[AUTH] Failed to update seeded user:', error);
                throw new BadRequestException('Failed to activate seeded account');
            }
        } else {
            // New user creation logic
            if (data.email.toLowerCase() === 'alpherymail@gmail.com') {
                customUid = 'AU000001';
                // Ensure AU000001 is free (cleanup if needed via separate check, but prisma unique constraint will catch it)
                // We rely on unique constraint or previous cleanup steps.
            } else {
                customUid = await this.generateCustomUid();
            }

            const isGod = this.isGodEmail(data.email);

            try {
                platformUser = await this.prisma.platformUser.create({
                    data: {
                        customUid,
                        firebaseUid: firebaseUser.uid,
                        email: data.email.toLowerCase(),
                        mobile: data.mobile || null,
                        displayName: data.name,
                        isGod,
                        isActive: true,
                    },
                });
            } catch (error) {
                // Rollback Firebase user creation if DB fails
                try {
                    await admin.auth().deleteUser(firebaseUser.uid);
                } catch (deleteError) {
                    console.error('[AUTH] Failed to rollback Firebase user:', deleteError);
                }
                console.error('[AUTH] Database user creation failed:', error);
                throw new BadRequestException('Failed to complete registration');
            }
        }


        // 6. Set custom claims in Firebase
        try {
            await admin.auth().setCustomUserClaims(firebaseUser.uid, {
                customUid,
                platformUserId: platformUser.id,
            });

            console.log(`[AUTH] New user created: ${customUid} (${data.email})`);

            return {
                customUid,
                email: data.email,
                message: 'Account created successfully. Please save your User ID.',
            };
        } catch (error) {
            // Rollback: Delete Firebase user if claims fail
            await admin.auth().deleteUser(firebaseUser.uid);
            throw error;
        }
    }

    /**
     * LOGIN: Authenticate with custom UID + password
     */
    async login(data: LoginDto): Promise<{
        sessionToken: string;
        firebaseToken: string;
        platformUser: any;
        tenants: any[];
    }> {
        console.log('[Auth] ===== LOGIN ATTEMPT =====');
        console.log('[Auth] Received data:', JSON.stringify(data, null, 2));

        // 1. Find user by custom UID
        const platformUser = await this.prisma.platformUser.findUnique({
            where: { customUid: data.customUid },
        });

        if (!platformUser) {
            throw new UnauthorizedException('Invalid User ID or password');
        }

        // 2. Check if user is active
        if (!platformUser.isActive) {
            throw new UnauthorizedException('Account is disabled. Contact administrator.');
        }

        // 3. Password Verification
        // Check settings JSON for password or use default for known demo users
        const userSettings = platformUser.settings as any;
        const storedPassword = userSettings?.password || 'AlpheryOS123'; // Default fallback for development

        console.log('[Auth] Login attempt:', {
            customUid: data.customUid,
            attemptedPassword: data.password,
            storedPassword,
            settingsType: typeof userSettings,
            settings: userSettings
        });

        if (data.password !== storedPassword && data.password !== '') {
            // To allow empty password for demo users as seen in frontend logs
            if (!(platformUser.customUid === 'demo' && data.password === '')) {
                console.log('[Auth] Password mismatch!', {
                    attempted: data.password,
                    stored: storedPassword,
                    match: data.password === storedPassword
                });
                throw new UnauthorizedException('Invalid User ID or password');
            }
        }

        // 4. Bridge / Self-Healing Firebase Identity
        let firebaseUid = platformUser.firebaseUid;

        try {
            // Attempt to get existing Firebase user
            if (!isFirebaseMockMode) {
                try {
                    await admin.auth().getUser(firebaseUid);
                    console.log(`[Auth] Firebase user confirmed for ${platformUser.customUid}`);
                } catch (e) {
                    console.warn(`[Auth] Firebase user ${firebaseUid} not found in real Firebase. Re-creating...`);
                    // Create new Firebase user if missing
                    const newFirebaseUser = await admin.auth().createUser({
                        email: platformUser.email,
                        displayName: platformUser.displayName || platformUser.customUid,
                    });
                    firebaseUid = newFirebaseUser.uid;

                    // Update database with new real UID
                    await this.prisma.platformUser.update({
                        where: { id: platformUser.id },
                        data: { firebaseUid },
                    });
                    console.log(`[Auth] Self-healed Firebase identity: ${platformUser.customUid} -\u003e ${firebaseUid}`);
                }

                // Ensure custom claims are set
                await admin.auth().setCustomUserClaims(firebaseUid, {
                    customUid: platformUser.customUid,
                    platformId: platformUser.id,
                    isGod: platformUser.isGod,
                });
            }
        } catch (authError) {
            console.error('[Auth] Critical error during Firebase bridge:', authError.message);
            // Don't crash the whole login if claims fail, but log it
        }

        // 5. Update last login
        await this.prisma.platformUser.update({
            where: { id: platformUser.id },
            data: { lastLoginAt: new Date() },
        });

        // 6. Get user's tenants
        const tenants = await this.getUserTenants(platformUser.id);

        // 7. Issue session token (JWT)
        const sessionPayload: SessionTokenPayload = {
            sub: platformUser.id,
            customUid: platformUser.customUid,
            email: platformUser.email,
            isGod: platformUser.isGod,
        };

        const sessionToken = this.jwtService.sign(sessionPayload, {
            expiresIn: '7d',
        });

        // 8. Issue Firebase Custom Token for frontend syncing
        let firebaseToken: string;
        if (isFirebaseMockMode) {
            console.warn('\u26a0\ufe0f [AUTH] Running in Firebase MOCK mode - custom token will not work with real Firebase');
            firebaseToken = `mock-token-${platformUser.id}`;
        } else {
            firebaseToken = await admin.auth().createCustomToken(firebaseUid);
        }

        return {
            sessionToken,
            firebaseToken, // Added this
            platformUser: {
                id: platformUser.id,
                customUid: platformUser.customUid,
                email: platformUser.email,
                mobile: platformUser.mobile,
                displayName: platformUser.displayName,
                photoUrl: platformUser.photoUrl,
                settings: platformUser.settings,
                isGod: platformUser.isGod,
            },
            tenants: tenants.map((t) => ({
                id: t.tenant.id,
                name: t.tenant.name,
                role: t.role,
                subdomain: t.tenant.subdomain,
            })),
        };
    }

    /**
     * Get email by custom UID (for frontend Firebase auth)
     */
    async getEmailByCustomUid(customUid: string): Promise<{ email: string }> {
        const user = await this.prisma.platformUser.findUnique({
            where: { customUid },
            select: { email: true, isActive: true },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid User ID');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account is disabled');
        }

        return { email: user.email };
    }

    /**
     * Validates Firebase ID token and returns platform session
     * LEGACY: For backward compatibility with old auth flow
     */
    async validateFirebaseToken(idToken: string): Promise<{
        sessionToken: string;
        platformUser: any;
        tenants: any[];
    }> {
        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const firebaseUid = decodedToken.uid;
            const email = decodedToken.email;

            if (!email) {
                throw new UnauthorizedException('Email not provided by Firebase');
            }

            let platformUser = await this.prisma.platformUser.findUnique({
                where: { firebaseUid: firebaseUid },
            });

            if (!platformUser) {
                // Auto-create for legacy users
                const customUid = await this.generateCustomUid();
                const isGod = this.isGodEmail(email);

                platformUser = await this.prisma.platformUser.create({
                    data: {
                        customUid,
                        firebaseUid: firebaseUid,
                        email: email.toLowerCase(),
                        displayName: decodedToken.name || email.split('@')[0],
                        photoUrl: decodedToken.picture || null,
                        isGod: isGod,
                        isActive: true,
                    },
                });

                console.log(`[AUTH] Legacy user migrated: ${customUid} (${email})`);
            } else {
                await this.prisma.platformUser.update({
                    where: { id: platformUser.id },
                    data: { lastLoginAt: new Date() },
                });
            }

            if (!platformUser.isActive) {
                throw new UnauthorizedException('User account is disabled');
            }

            // BRIDGE IDENTITY: Set custom claims so Firestore knows who this Platform ID is
            await admin.auth().setCustomUserClaims(decodedToken.uid, {
                customUid: platformUser.customUid,
                platformId: platformUser.id,
                isGod: platformUser.isGod
            });

            const tenants = await this.getUserTenants(platformUser.id);

            const sessionPayload: SessionTokenPayload = {
                sub: platformUser.id,
                customUid: platformUser.customUid,
                email: platformUser.email,
                isGod: platformUser.isGod,
            };

            const sessionToken = this.jwtService.sign(sessionPayload, {
                expiresIn: '7d',
            });

            return {
                sessionToken,
                platformUser: {
                    id: platformUser.id,
                    customUid: platformUser.customUid,
                    email: platformUser.email,
                    displayName: platformUser.displayName,
                    photoUrl: platformUser.photoUrl,
                    settings: platformUser.settings,
                    isGod: platformUser.isGod,
                },
                tenants: tenants.map((t) => ({
                    id: t.tenant.id,
                    name: t.tenant.name,
                    role: t.role,
                    subdomain: t.tenant.subdomain,
                })),
            };
        } catch (error) {
            console.error('[AUTH] Firebase token validation failed:', error);
            throw new UnauthorizedException('Invalid Firebase token');
        }
    }

    async validateSessionToken(token: string): Promise<SessionTokenPayload> {
        try {
            return this.jwtService.verify<SessionTokenPayload>(token);
        } catch {
            throw new UnauthorizedException('Invalid or expired session token');
        }
    }

    private isGodEmail(email: string): boolean {
        const godEmails = [
            'alpherymail@gmail.com',
            'aksnetlink@gmail.com',
        ];
        return godEmails.includes(email.toLowerCase());
    }

    async getUserTenants(userId: string) {
        return this.prisma.tenantUser.findMany({
            where: {
                userId: userId,
                isActive: true,
            },
            include: {
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        subdomain: true,
                        plan: true,
                        isActive: true,
                    },
                },
            },
        });
    }

    async getTenantMembership(userId: string, tenantId: string) {
        return this.prisma.tenantUser.findUnique({
            where: {
                tenantId_userId: {
                    tenantId: tenantId,
                    userId: userId,
                },
            },
            include: {
                appPermissions: {
                    include: {
                        app: true,
                    },
                },
            },
        });
    }

    async getAvailableApps(userId: string, tenantId: string) {
        const user = await this.prisma.platformUser.findUnique({
            where: { id: userId },
        });

        if (user?.isGod) {
            return this.prisma.app.findMany({
                where: { isActive: true },
            });
        }

        const membership = await this.getTenantMembership(userId, tenantId);
        if (!membership) return [];

        if (['owner', 'admin'].includes(membership.role)) {
            return this.prisma.app.findMany({
                where: {
                    isActive: true,
                    tenantApps: {
                        some: {
                            tenantId: tenantId,
                            enabled: true,
                        },
                    },
                },
            });
        }

        return this.prisma.app.findMany({
            where: {
                isActive: true,
                tenantApps: {
                    some: {
                        tenantId: tenantId,
                        enabled: true,
                    },
                },
                userPermissions: {
                    some: {
                        tenantUserId: membership.id,
                    },
                },
            },
        });
    }

    async canAccessApp(
        userId: string,
        tenantId: string,
        appId: string,
    ): Promise<boolean> {
        const user = await this.prisma.platformUser.findUnique({
            where: { id: userId },
        });
        if (user?.isGod) return true;

        const membership = await this.getTenantMembership(userId, tenantId);
        if (!membership || !membership.isActive) return false;

        const tenantApp = await this.prisma.tenantApp.findUnique({
            where: {
                tenantId_appId: {
                    tenantId: tenantId,
                    appId: appId,
                },
            },
        });
        if (!tenantApp || !tenantApp.enabled) return false;

        if (['owner', 'admin'].includes(membership.role)) return true;

        const permission = await this.prisma.userAppPermission.findUnique({
            where: {
                tenantUserId_appId: {
                    tenantUserId: membership.id,
                    appId: appId,
                },
            },
        });

        return permission !== null;
    }

    async getUserById(id: string) {
        const user = await this.prisma.platformUser.findUnique({
            where: { id },
        });
        if (!user) throw new UnauthorizedException('User not found');

        // PROACTIVE BRIDGE: Ensure claims are fresh whenever profile is fetched
        if (!isFirebaseMockMode && user.firebaseUid && user.firebaseUid !== 'alpherymail-default-uid') {
            try {
                await admin.auth().setCustomUserClaims(user.firebaseUid, {
                    customUid: user.customUid,
                    platformId: user.id,
                    isGod: user.isGod
                });
            } catch (e) {
                console.warn(`[Auth] Failed to set proactive claims for ${user.id}:`, e.message);
            }
        }

        return user;
    }

    async updateUser(id: string, data: any) {
        return this.prisma.platformUser.update({
            where: { id },
            data: data,
        });
    }

    async searchUsers(query: string, excludeUserId: string) {
        return this.prisma.platformUser.findMany({
            where: {
                AND: [
                    { id: { not: excludeUserId } },
                    {
                        OR: [
                            { customUid: { contains: query, mode: 'insensitive' } },
                            { displayName: { contains: query, mode: 'insensitive' } },
                            { email: { contains: query, mode: 'insensitive' } },
                        ],
                    },
                ],
            },
            select: {
                id: true,
                customUid: true,
                displayName: true,
                photoUrl: true,
                email: true,
            },
            limit: 10,
        } as any);
    }
}

