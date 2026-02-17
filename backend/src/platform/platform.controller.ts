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

    // CREATE TENANT
    @Post('tenants')
    async createTenant(
        @Body() data: {
            name: string;
            ownerEmail: string;
            organizationEmail?: string;
            businessType?: string;
        },
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
                    customUid: await this.generateNextUid('AT'),
                    email: email,
                    role: 'tenant_admin', // Default to tenant admin for organization owners
                    isActive: true,
                }
            });
        } else if (owner.role === 'user') {
            // Upgrade role AND UID prefix if they were just a regular user
            const nextAtUid = await this.generateNextUid('AT');
            await this.prisma.platformUser.update({
                where: { id: owner.id },
                data: {
                    role: 'tenant_admin',
                    customUid: nextAtUid // Upgrade to AT prefix
                }
            });
            // Re-fetch to get new customUid for the rest of the flow
            owner = await this.prisma.platformUser.findUnique({ where: { id: owner.id } });
        }

        if (!owner) throw new BadRequestException('Failed to resolve organization owner');
        const customShortId = await this.generateNextShortId('AT');

        // 3. Create tenant
        const tenant = await this.prisma.tenant.create({
            data: {
                customShortId,
                name: data.name,
                organizationEmail: data.organizationEmail || email,
                businessType: data.businessType || 'General',
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

        // 5. Enable core apps
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

    // UPDATE TENANT
    @Patch('tenants/:id')
    async updateTenant(
        @Param('id') id: string,
        @Body() data: {
            name?: string;
            plan?: string;
            isActive?: boolean;
            organizationEmail?: string;
            businessType?: string;
            mobile?: string;
            address?: string;
            personalEmail?: string;
        },
    ) {
        return this.prisma.tenant.update({
            where: { id },
            data,
        });
    }

    // DELETE TENANT
    @Delete('tenants/:id')
    async deleteTenant(@Param('id') id: string) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id },
        });

        if (!tenant) throw new BadRequestException('Tenant not found');

        const ownerId = tenant.ownerUserId;

        // 1. Delete the tenant first
        const deletedTenant = await this.prisma.tenant.delete({
            where: { id },
        });

        // 2. Automatically delete the owner if they have no other memberships
        // (and they aren't the primary God user)
        const owner = await this.prisma.platformUser.findUnique({
            where: { id: ownerId },
            include: { tenantMemberships: true }
        });

        if (owner && !owner.isGod && owner.email !== 'alpherymail@gmail.com') {
            if (owner.tenantMemberships.length === 0) {
                await this.prisma.platformUser.delete({
                    where: { id: ownerId }
                });
            }
        }

        return deletedTenant;
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

    // TOGGLE USER STATUS
    @Patch('users/:userId/toggle-status')
    async toggleUserStatus(@Param('userId') userId: string) {
        const user = await this.prisma.platformUser.findUnique({
            where: { id: userId },
        });

        if (!user) throw new BadRequestException('User not found');

        return this.prisma.platformUser.update({
            where: { id: userId },
            data: { isActive: !user.isActive },
        });
    }

    // DELETE PLATFORM USER PERMANENTLY
    @Delete('users/:userId')
    async deleteUser(@Param('userId') userId: string) {
        const user = await this.prisma.platformUser.findUnique({
            where: { id: userId },
        });

        if (!user) throw new BadRequestException('User not found');

        // Safety: Never delete the primary God user
        if (user.email === 'alpherymail@gmail.com' || user.isGod) {
            throw new BadRequestException('Cannot delete the primary platform administrator');
        }

        return this.prisma.platformUser.delete({
            where: { id: userId },
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
        @Body() data: {
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

    // Helper for short ID generation (AT01, AT02...)
    private async generateNextShortId(prefix: string): Promise<string> {
        const lastTenant = await this.prisma.tenant.findFirst({
            where: { customShortId: { startsWith: prefix } },
            orderBy: { customShortId: 'desc' }
        });

        let nextNum = 1;
        if (lastTenant && lastTenant.customShortId) {
            const numPart = parseInt(lastTenant.customShortId.replace(prefix, ''));
            if (!isNaN(numPart)) nextNum = numPart + 1;
        }

        const paddedNum = nextNum.toString().padStart(2, '0');
        return `${prefix}${paddedNum}`;
    }

    // Helper for PlatformUser UID generation (AU0001...)
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

        if (!membership) throw new Error('User not found in tenant');

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
            include: { app: true },
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
            update: { enabled: true },
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
        const membership = await this.prisma.tenantUser.findUnique({
            where: {
                tenantId_userId: {
                    tenantId,
                    userId,
                },
            },
        });

        if (!membership) throw new Error('User not found in tenant');

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

        if (!membership) throw new Error('User not found in tenant');

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
