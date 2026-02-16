import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformGuard, TenantGuard } from '../auth/guards';

// ═══════════════════════════════════════════════════════════
// PLATFORM CONTROLLER (God Mode Only)
// ═══════════════════════════════════════════════════════════

@Controller('platform')
@UseGuards(PlatformGuard)
export class PlatformController {
    constructor(private prisma: PrismaService) { }

    // LIST ALL TENANTS
    @Get('tenants')
    async getAllTenants() {
        return this.prisma.tenant.findMany({
            include: {
                owner: {
                    select: {
                        id: true,
                        email: true,
                        displayName: true,
                    },
                },
                _count: {
                    select: {
                        users: true,
                        apps: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // CREATE TENANT (Simplified: Only Name & Email)
    @Post('tenants')
    async createTenant(
        @Body() data: { name: string; ownerEmail: string },
    ) {
        const email = data.ownerEmail.toLowerCase();

        // 1. Find or auto-create owner
        let owner = await this.prisma.platformUser.findFirst({
            where: { email },
        });

        if (!owner) {
            // Auto-create platform user placeholder
            owner = await this.prisma.platformUser.create({
                data: {
                    customUid: await this.generateNextUid('AU'),
                    email: email,
                    role: 'user',
                    isActive: true,
                }
            });
        }

        // 2. Auto-generate subdomain
        const subdomain = data.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + Math.random().toString(36).substring(2, 5);

        // 3. Create tenant
        const tenant = await this.prisma.tenant.create({
            data: {
                name: data.name,
                subdomain: subdomain,
                ownerUserId: owner.id,
                plan: 'free',
                allowedApps: [],
            },
        });

        // 4. Add owner as tenant member
        await this.prisma.tenantUser.create({
            data: {
                tenantId: tenant.id,
                userId: owner.id,
                role: 'owner',
            },
        });

        // 5. Enable core apps for new tenant
        const coreApps = await this.prisma.app.findMany({
            where: { isCore: true },
        });

        for (const app of coreApps) {
            await this.prisma.tenantApp.create({
                data: {
                    tenantId: tenant.id,
                    appId: app.id,
                    enabled: true,
                },
            });
        }

        return tenant;
    }

    // Helper for UID generation
    private async generateNextUid(prefix: string): Promise<string> {
        const lastUser = await this.prisma.platformUser.findFirst({
            where: { customUid: { startsWith: prefix } },
            orderBy: { customUid: 'desc' }
        });
        let nextNum = 1;
        if (lastUser) {
            const numPart = parseInt(lastUser.customUid.replace(prefix, ''));
            if (!isNaN(numPart)) nextNum = numPart + 1;
        }
        return `${prefix}${nextNum.toString().padStart(6, '0')}`;
    }

    // LIST ALL PLATFORM USERS
    @Get('users')
    async getAllUsers() {
        return this.prisma.platformUser.findMany({
            include: {
                tenantMemberships: {
                    include: {
                        tenant: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // PROMOTE USER TO GOD
    @Patch('users/:userId/promote-god')
    async promoteToGod(@Param('userId') userId: string) {
        return this.prisma.platformUser.update({
            where: { id: userId },
            data: { isGod: true },
        });
    }

    // TOGGLE USER STATUS (ACTIVATE/DEACTIVATE)
    @Patch('users/:userId/toggle-status')
    async toggleUserStatus(@Param('userId') userId: string) {
        const user = await this.prisma.platformUser.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error('User not found');
        }

        return this.prisma.platformUser.update({
            where: { id: userId },
            data: { isActive: !user.isActive },
        });
    }

    // LIST ALL APPS
    @Get('apps')
    async getAllApps() {
        return this.prisma.app.findMany({
            include: {
                _count: {
                    select: {
                        tenantApps: true,
                    },
                },
            },
        });
    }

    // CREATE APP
    @Post('apps')
    async createApp(
        @Body()
        data: {
            id: string;
            code: string;
            name: string;
            description?: string;
            category?: string;
            isCore?: boolean;
        },
    ) {
        return this.prisma.app.create({
            data,
        });
    }
}

// ═══════════════════════════════════════════════════════════
// TENANT CONTROLLER (Tenant Admins)
// ═══════════════════════════════════════════════════════════

@Controller('tenants/:tenantId')
@UseGuards(TenantGuard)
export class TenantController {
    constructor(private prisma: PrismaService) { }

    // GET TENANT DETAILS
    @Get()
    async getTenant(@Param('tenantId') tenantId: string) {
        return this.prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                owner: {
                    select: {
                        id: true,
                        email: true,
                        displayName: true,
                    },
                },
                _count: {
                    select: {
                        users: true,
                        apps: true,
                    },
                },
            },
        });
    }

    // LIST TENANT MEMBERS
    @Get('users')
    async getTenantUsers(@Param('tenantId') tenantId: string) {
        return this.prisma.tenantUser.findMany({
            where: { tenantId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        displayName: true,
                        photoUrl: true,
                    },
                },
                appPermissions: {
                    include: {
                        app: true,
                    },
                },
            },
        });
    }

    // INVITE USER TO TENANT
    @Post('users/invite')
    async inviteUser(
        @Param('tenantId') tenantId: string,
        @Request() req,
        @Body() data: { email: string; role?: string },
    ) {
        const token = Math.random().toString(36).substring(2);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        return this.prisma.invitation.create({
            data: {
                tenantId,
                email: data.email.toLowerCase(),
                role: data.role || 'member',
                token,
                invitedByUserId: req.user.sub,
                expiresAt,
            },
        });
    }

    // UPDATE USER ROLE
    @Patch('users/:userId/role')
    async updateUserRole(
        @Param('tenantId') tenantId: string,
        @Param('userId') userId: string,
        @Body() data: { role: string },
    ) {
        const membership = await this.prisma.tenantUser.findUnique({
            where: {
                tenantId_userId: {
                    tenantId,
                    userId,
                },
            },
        });

        if (!membership) {
            throw new Error('User not found in tenant');
        }

        return this.prisma.tenantUser.update({
            where: { id: membership.id },
            data: { role: data.role },
        });
    }

    // LIST ENABLED APPS
    @Get('apps')
    async getTenantApps(@Param('tenantId') tenantId: string) {
        return this.prisma.tenantApp.findMany({
            where: { tenantId },
            include: {
                app: true,
            },
        });
    }

    // ENABLE APP
    @Post('apps/:appId')
    async enableApp(
        @Param('tenantId') tenantId: string,
        @Param('appId') appId: string,
        @Request() req,
    ) {
        return this.prisma.tenantApp.upsert({
            where: {
                tenantId_appId: {
                    tenantId,
                    appId,
                },
            },
            update: {
                enabled: true,
            },
            create: {
                tenantId,
                appId,
                enabled: true,
                enabledByUserId: req.user.sub,
            },
        });
    }

    // DISABLE APP
    @Delete('apps/:appId')
    async disableApp(
        @Param('tenantId') tenantId: string,
        @Param('appId') appId: string,
    ) {
        return this.prisma.tenantApp.update({
            where: {
                tenantId_appId: {
                    tenantId,
                    appId,
                },
            },
            data: { enabled: false },
        });
    }

    // GRANT APP PERMISSION TO USER
    @Post('users/:userId/apps/:appId')
    async grantAppPermission(
        @Param('tenantId') tenantId: string,
        @Param('userId') userId: string,
        @Param('appId') appId: string,
        @Request() req,
        @Body() data?: { permissions?: any },
    ) {
        // Get tenant user membership
        const membership = await this.prisma.tenantUser.findUnique({
            where: {
                tenantId_userId: {
                    tenantId,
                    userId,
                },
            },
        });

        if (!membership) {
            throw new Error('User not found in tenant');
        }

        return this.prisma.userAppPermission.upsert({
            where: {
                tenantUserId_appId: {
                    tenantUserId: membership.id,
                    appId,
                },
            },
            update: {
                permissions: data?.permissions || { read: true, write: true, delete: false },
            },
            create: {
                tenantUserId: membership.id,
                appId,
                permissions: data?.permissions || { read: true, write: true, delete: false },
                grantedByUserId: req.user.sub,
            },
        });
    }

    // REVOKE APP PERMISSION
    @Delete('users/:userId/apps/:appId')
    async revokeAppPermission(
        @Param('tenantId') tenantId: string,
        @Param('userId') userId: string,
        @Param('appId') appId: string,
    ) {
        const membership = await this.prisma.tenantUser.findUnique({
            where: {
                tenantId_userId: {
                    tenantId,
                    userId,
                },
            },
        });

        if (!membership) {
            throw new Error('User not found in tenant');
        }

        return this.prisma.userAppPermission.delete({
            where: {
                tenantUserId_appId: {
                    tenantUserId: membership.id,
                    appId,
                },
            },
        });
    }
}
