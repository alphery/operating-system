import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

interface SessionTokenPayload {
    sub: string; // platform_user.id (UUID)
    customUid: string; // AA000001, AT000001, AU000001
    email: string;
    role: string; // super_admin, tenant_admin, user
    isGod: boolean;
}

interface LoginDto {
    customUid: string; // AA000001, AT000001, AU000001
    password: string;
}

interface CreateTenantDto {
    name: string;
    email: string;
    password: string;
    displayName?: string;
}

interface CreateUserDto {
    tenantId: string;
    name: string;
    email: string;
    password: string;
    displayName?: string;
}

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    /**
     * SIMPLE LOGIN: AA/AT/AU + Password
     */
    async login(data: LoginDto): Promise<{
        sessionToken: string;
        platformUser: any;
        tenants: any[];
    }> {
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

        // 3. Verify password
        if (!platformUser.passwordHash) {
            throw new UnauthorizedException('Account not properly configured. Contact administrator.');
        }

        const isPasswordValid = await bcrypt.compare(data.password, platformUser.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid User ID or password');
        }

        // 4. Update last login
        await this.prisma.platformUser.update({
            where: { id: platformUser.id },
            data: { lastLoginAt: new Date() },
        });

        // 5. Get user's tenants
        const tenants = await this.getUserTenants(platformUser.id);

        // 6. Issue session token
        const sessionPayload: SessionTokenPayload = {
            sub: platformUser.id,
            customUid: platformUser.customUid,
            email: platformUser.email,
            role: platformUser.role,
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
                mobile: platformUser.mobile,
                displayName: platformUser.displayName,
                photoUrl: platformUser.photoUrl,
                role: platformUser.role,
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
     * CREATE TENANT (Super Admin only)
     * Creates AT000001, AT000002, etc.
     */
    async createTenant(createdBy: string, data: CreateTenantDto): Promise<{
        customUid: string;
        email: string;
        message: string;
    }> {
        // 1. Verify creator is super admin
        const creator = await this.prisma.platformUser.findUnique({
            where: { customUid: createdBy },
        });

        if (!creator || creator.role !== 'super_admin') {
            throw new UnauthorizedException('Only super admins can create tenants');
        }

        // 2. Generate next AT ID
        const lastTenant = await this.prisma.platformUser.findFirst({
            where: { customUid: { startsWith: 'AT' } },
            orderBy: { customUid: 'desc' },
        });

        let nextNumber = 1;
        if (lastTenant) {
            const lastNumber = parseInt(lastTenant.customUid.substring(2));
            nextNumber = lastNumber + 1;
        }

        const customUid = `AT${String(nextNumber).padStart(6, '0')}`;

        // 3. Hash password
        const passwordHash = await bcrypt.hash(data.password, 10);

        // 4. Create tenant admin user
        const tenantAdmin = await this.prisma.platformUser.create({
            data: {
                customUid,
                email: data.email.toLowerCase(),
                displayName: data.displayName || data.name,
                passwordHash,
                role: 'tenant_admin',
                isGod: false,
                isActive: true,
                createdBy: createdBy,

            },
        });

        // 5. Create tenant organization
        const tenant = await this.prisma.tenant.create({
            data: {
                name: data.name,
                ownerUserId: tenantAdmin.id,
                plan: 'free',
                isActive: true,
            },
        });

        // 6. Add tenant admin as owner in tenant_users
        await this.prisma.tenantUser.create({
            data: {
                tenantId: tenant.id,
                userId: tenantAdmin.id,
                role: 'owner',
                isActive: true,
            },
        });

        console.log(`[AUTH] Tenant created: ${customUid} by ${createdBy}`);

        return {
            customUid,
            email: data.email,
            message: 'Tenant created successfully. Save the Tenant ID.',
        };
    }

    /**
     * CREATE USER (Tenant Admin only)
     * Creates AU000001, AU000002, etc. under a tenant
     */
    async createUser(createdBy: string, data: CreateUserDto): Promise<{
        customUid: string;
        email: string;
        message: string;
    }> {
        // 1. Verify creator is tenant admin
        const creator = await this.prisma.platformUser.findUnique({
            where: { customUid: createdBy },
        });

        if (!creator || creator.role !== 'tenant_admin') {
            throw new UnauthorizedException('Only tenant admins can create users');
        }

        // 2. Verify creator owns this tenant
        const membership = await this.prisma.tenantUser.findFirst({
            where: {
                userId: creator.id,
                tenantId: data.tenantId,
                role: 'owner',
            },
        });

        if (!membership) {
            throw new UnauthorizedException('You do not have permission to create users in this tenant');
        }

        // 3. Generate next AU ID
        const lastUser = await this.prisma.platformUser.findFirst({
            where: { customUid: { startsWith: 'AU' } },
            orderBy: { customUid: 'desc' },
        });

        let nextNumber = 1;
        if (lastUser) {
            const lastNumber = parseInt(lastUser.customUid.substring(2));
            nextNumber = lastNumber + 1;
        }

        const customUid = `AU${String(nextNumber).padStart(6, '0')}`;

        // 4. Hash password
        const passwordHash = await bcrypt.hash(data.password, 10);

        // 5. Create user
        const user = await this.prisma.platformUser.create({
            data: {
                customUid,
                email: data.email.toLowerCase(),
                displayName: data.displayName || data.name,
                passwordHash,
                role: 'user',
                isGod: false,
                isActive: true,
                createdBy: createdBy,

            },
        });

        // 6. Add user to tenant
        await this.prisma.tenantUser.create({
            data: {
                tenantId: data.tenantId,
                userId: user.id,
                role: 'member',
                isActive: true,
            },
        });

        console.log(`[AUTH] User created: ${customUid} by ${createdBy} in tenant ${data.tenantId}`);

        return {
            customUid,
            email: data.email,
            message: 'User created successfully. Save the User ID.',
        };
    }

    /**
     * Get email by custom UID (for backward compatibility)
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

    async validateSessionToken(token: string): Promise<SessionTokenPayload> {
        try {
            return this.jwtService.verify<SessionTokenPayload>(token);
        } catch {
            throw new UnauthorizedException('Invalid or expired session token');
        }
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
        return user;
    }

    async updateUser(id: string, data: any) {
        return this.prisma.platformUser.update({
            where: { id },
            data: data,
        });
    }
}
