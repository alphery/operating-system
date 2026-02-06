import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as admin from 'firebase-admin';

interface FirebaseTokenPayload {
    uid: string;
    email: string;
    name?: string;
    picture?: string;
}

interface SessionTokenPayload {
    sub: string; // platform_user.id (UUID)
    email: string;
    isGod: boolean;
}

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    /**
     * Validates Firebase ID token and returns platform session
     * CRITICAL: Firebase is ONLY for identity verification
     * Authorization is handled by our system
     */
    async validateFirebaseToken(idToken: string): Promise<{
        sessionToken: string;
        platformUser: any;
    }> {
        try {
            // Step 1: Verify Firebase token signature and expiry
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const firebaseUid = decodedToken.uid;
            const email = decodedToken.email;

            if (!email) {
                throw new UnauthorizedException('Email not provided by Firebase');
            }

            // Step 2: Lookup or create platform user
            let platformUser = await this.prisma.platformUser.findUnique({
                where: { firebaseUid: firebaseUid },
            });

            if (!platformUser) {
                // First-time login: Auto-create platform user
                const isGod = this.isGodEmail(email);

                platformUser = await this.prisma.platformUser.create({
                    data: {
                        firebaseUid: firebaseUid,
                        email: email.toLowerCase(),
                        displayName: decodedToken.name || email.split('@')[0],
                        photoUrl: decodedToken.picture || null,
                        isGod: isGod,
                        isActive: true,
                    },
                });

                console.log(
                    `[AUTH] New platform user created: ${email} (god: ${isGod})`,
                );
            } else {
                // Update last login
                await this.prisma.platformUser.update({
                    where: { id: platformUser.id },
                    data: { lastLoginAt: new Date() },
                });
            }

            // Step 3: Check if user is active
            if (!platformUser.isActive) {
                throw new UnauthorizedException('User account is disabled');
            }

            // Step 4: Issue OUR session token (JWT with UUID, not firebase_uid)
            const sessionPayload: SessionTokenPayload = {
                sub: platformUser.id, // UUID
                email: platformUser.email,
                isGod: platformUser.isGod,
            };

            const sessionToken = this.jwtService.sign(sessionPayload, {
                expiresIn: '7d', // Long-lived session
            });

            return {
                sessionToken,
                platformUser: {
                    id: platformUser.id,
                    email: platformUser.email,
                    displayName: platformUser.displayName,
                    photoUrl: platformUser.photoUrl,
                    isGod: platformUser.isGod,
                },
            };
        } catch (error) {
            console.error('[AUTH] Firebase token validation failed:', error);
            throw new UnauthorizedException('Invalid Firebase token');
        }
    }

    /**
     * Validates our session token and returns user payload
     */
    async validateSessionToken(token: string): Promise<SessionTokenPayload> {
        try {
            return this.jwtService.verify<SessionTokenPayload>(token);
        } catch {
            throw new UnauthorizedException('Invalid or expired session token');
        }
    }

    /**
     * Check if email is a platform god (hardcoded for now)
     */
    private isGodEmail(email: string): boolean {
        const godEmails = [
            'alpherymail@gmail.com',
            'aksnetlink@gmail.com',
            // Add more platform owners here
        ];
        return godEmails.includes(email.toLowerCase());
    }

    /**
     * Get user's tenant memberships
     */
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

    /**
     * Get user's tenant membership details
     */
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

    /**
     * Check if user can access specific app in tenant
     */
    async canAccessApp(
        userId: string,
        tenantId: string,
        appId: string,
    ): Promise<boolean> {
        // 1. Check if user is god
        const user = await this.prisma.platformUser.findUnique({
            where: { id: userId },
        });
        if (user?.isGod) return true;

        // 2. Check tenant membership
        const membership = await this.getTenantMembership(userId, tenantId);
        if (!membership || !membership.isActive) return false;

        // 3. Check if tenant has app enabled
        const tenantApp = await this.prisma.tenantApp.findUnique({
            where: {
                tenantId_appId: {
                    tenantId: tenantId,
                    appId: appId,
                },
            },
        });
        if (!tenantApp || !tenantApp.enabled) return false;

        // 4. Owner/Admin auto-grant
        if (['owner', 'admin'].includes(membership.role)) return true;

        // 5. Check explicit permission
        const permission = await this.prisma.platformUserAppPermission.findUnique({
            where: {
                tenantUserId_appId: {
                    tenantUserId: membership.id,
                    appId: appId,
                },
            },
        });

        return permission !== null;
    }
}
