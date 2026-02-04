import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantService {
    constructor(private prisma: PrismaService) { }

    async createTenant(data: { name: string; plan?: string; allowedApps?: string[] }) {
        return this.prisma.tenant.create({
            data: {
                name: data.name,
                plan: data.plan || 'free',
                allowedApps: data.allowedApps || []
            },
        });
    }

    async findAllTenants() {
        return this.prisma.tenant.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { users: true }
                }
            }
        });
    }

    async getTenant(tenantId: string) {
        return this.prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                users: true,
                _count: {
                    select: {
                        clients: true,
                        projects: true,
                        tasks: true,
                    },
                },
            },
        });
    }

    async updateTenant(tenantId: string, data: any) {
        return this.prisma.tenant.update({
            where: { id: tenantId },
            data,
        });
    }

    async deleteTenant(tenantId: string) {
        return this.prisma.tenant.delete({
            where: { id: tenantId },
        });
    }
}
