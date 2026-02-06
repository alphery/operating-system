import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

// ═══════════════════════════════════════════════════════════
// PLATFORM GUARD: God Mode Only
// ═══════════════════════════════════════════════════════════

@Injectable()
export class PlatformGuard implements CanActivate {
    constructor(private jwtService: JwtService) { }

    async canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const token = this.extractToken(request);

        if (!token) {
            throw new UnauthorizedException('No authentication token provided');
        }

        try {
            const payload = this.jwtService.verify(token);
            request.user = payload; // { sub: user_id, email, isGod }

            // Platform-level routes require god mode
            if (!payload.isGod) {
                throw new ForbiddenException(
                    'Platform access denied. God mode required.',
                );
            }

            return true;
        } catch (error) {
            if (error instanceof ForbiddenException) throw error;
            throw new UnauthorizedException('Invalid authentication token');
        }
    }

    private extractToken(request: any): string | null {
        const authHeader = request.headers.authorization;
        if (!authHeader) return null;
        return authHeader.replace('Bearer ', '');
    }
}

// ═══════════════════════════════════════════════════════════
// TENANT GUARD: Enforce Tenant Membership
// ═══════════════════════════════════════════════════════════

@Injectable()
export class TenantGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const token = this.extractToken(request);

        if (!token) {
            throw new UnauthorizedException('No authentication token provided');
        }

        try {
            const payload = this.jwtService.verify(token);
            request.user = payload;

            // Extract tenant ID from header or URL param or body
            const tenantId =
                request.headers['x-tenant-id'] ||
                request.params.tenantId ||
                request.body?.tenantId ||
                request.query?.tenantId;

            if (!tenantId) {
                throw new ForbiddenException('Tenant ID required');
            }

            // God mode bypasses tenant membership check
            if (payload.isGod) {
                request.tenantId = tenantId;
                request.tenantRole = 'god';
                return true;
            }

            // Check if user belongs to this tenant
            const membership = await this.prisma.tenantUser.findUnique({
                where: {
                    tenantId_userId: {
                        tenantId: tenantId,
                        userId: payload.sub, // UUID
                    },
                },
            });

            if (!membership || !membership.isActive) {
                throw new ForbiddenException(
                    'You do not have access to this tenant workspace',
                );
            }

            // Inject tenant context into request
            request.tenantId = tenantId;
            request.tenantRole = membership.role;
            request.tenantUserId = membership.id; // For app permissions

            return true;
        } catch (error) {
            if (error instanceof ForbiddenException) throw error;
            throw new UnauthorizedException('Invalid authentication token');
        }
    }

    private extractToken(request: any): string | null {
        const authHeader = request.headers.authorization;
        if (!authHeader) return null;
        return authHeader.replace('Bearer ', '');
    }
}

// ═══════════════════════════════════════════════════════════
// APP PERMISSION GUARD: Fine-Grained App Access
// ═══════════════════════════════════════════════════════════

@Injectable()
export class AppPermissionGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): boolean {
        // Get required app from decorator
        const requiredApp = this.reflector.get<string>(
            'app',
            context.getHandler(),
        );

        if (!requiredApp) {
            return true; // No specific app required
        }

        const request = context.switchToHttp().getRequest();
        const userId = request.user?.sub;
        const tenantId = request.tenantId; // Injected by TenantGuard
        const isGod = request.user?.isGod;

        // God mode bypasses all app restrictions
        if (isGod) return true;

        if (!userId || !tenantId) {
            throw new UnauthorizedException('Missing authentication context');
        }

        // 1. Check if tenant has this app enabled
        const tenantApp = await this.prisma.tenantApp.findUnique({
            where: {
                tenantId_appId: {
                    tenantId: tenantId,
                    appId: requiredApp,
                },
            },
        });

        if (!tenantApp || !tenantApp.enabled) {
            throw new ForbiddenException(
                `App "${requiredApp}" is not enabled for your workspace`,
            );
        }

        // 2. Check if user has permission to this app
        const tenantUserId = request.tenantUserId; // Injected by TenantGuard
        const role = request.tenantRole;

        // Owner/Admin auto-grant
        if (['owner', 'admin'].includes(role)) {
            return true;
        }

        // Check explicit permission
        const permission = await this.prisma.userAppPermission.findUnique({
            where: {
                tenantUserId_appId: {
                    tenantUserId: tenantUserId,
                    appId: requiredApp,
                },
            },
        });

        if (!permission) {
            throw new ForbiddenException(
                `You do not have permission to access "${requiredApp}"`,
            );
        }

        return true;
    }
}
