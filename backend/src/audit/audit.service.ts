import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
    constructor(private prisma: PrismaService) { }

    /**
     * Log any action (create, update, delete)
     */
    async log(params: {
        tenantId: string;
        userId: string;
        action: 'CREATE' | 'UPDATE' | 'DELETE';
        entity: string;
        entityId: string;
        oldValue?: any;
        newValue?: any;
        ipAddress?: string;
        userAgent?: string;
    }) {
        return this.prisma.auditLog.create({
            data: {
                tenantId: params.tenantId,
                userId: params.userId,
                action: params.action,
                entity: params.entity,
                entityId: params.entityId,
                oldValue: params.oldValue || null,
                newValue: params.newValue || null,
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
            },
        });
    }

    /**
     * Get audit logs for a tenant
     */
    async findAll(tenantId: string, filters?: {
        entity?: string;
        userId?: string;
        action?: string;
        limit?: number;
    }) {
        return this.prisma.auditLog.findMany({
            where: {
                tenantId,
                ...(filters?.entity && { entity: filters.entity }),
                ...(filters?.userId && { userId: filters.userId }),
                ...(filters?.action && { action: filters.action }),
            },
            orderBy: { createdAt: 'desc' },
            take: filters?.limit || 100,
        });
    }

    /**
     * Get audit trail for specific entity
     */
    async findByEntity(tenantId: string, entity: string, entityId: string) {
        return this.prisma.auditLog.findMany({
            where: {
                tenantId,
                entity,
                entityId,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}
