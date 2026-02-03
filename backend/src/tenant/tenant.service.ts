import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantService {
    constructor(private prisma: PrismaService) { }

    /**
     * Create a new tenant (organization/company)
     * Called when a new customer signs up
     */
    async create(data: {
        name: string;
        subdomain?: string;
        plan?: string;
        adminEmail: string;
        adminName: string;
    }) {
        // Create tenant and admin user in a transaction
        return this.prisma.$transaction(async (tx) => {
            // Create the tenant
            const tenant = await tx.tenant.create({
                data: {
                    name: data.name,
                    subdomain: data.subdomain || data.name.toLowerCase().replace(/\s+/g, '-'),
                    plan: data.plan || 'free',
                },
            });

            // Create the admin user for this tenant
            const adminUser = await tx.user.create({
                data: {
                    email: data.adminEmail,
                    name: data.adminName,
                    tenantId: tenant.id,
                    role: 'admin',
                },
            });

            return { tenant, adminUser };
        });
    }

    /**
     * Get tenant by subdomain (for multi-domain routing)
     */
    async findBySubdomain(subdomain: string) {
        return this.prisma.tenant.findUnique({
            where: { subdomain },
            include: {
                users: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                    },
                },
            },
        });
    }

    /**
     * Get tenant by ID
     */
    async findById(id: string) {
        return this.prisma.tenant.findUnique({
            where: { id },
            include: {
                users: true,
                clients: true,
                projects: true,
            },
        });
    }

    /**
     * List all tenants (admin only)
     */
    async findAll() {
        return this.prisma.tenant.findMany({
            include: {
                _count: {
                    select: {
                        users: true,
                        clients: true,
                        projects: true,
                    },
                },
            },
        });
    }

    /**
     * Update tenant settings
     */
    async update(id: string, data: { name?: string; plan?: string; subdomain?: string }) {
        return this.prisma.tenant.update({
            where: { id },
            data,
        });
    }

    /**
     * Delete tenant (careful - cascades to all data!)
     */
    async delete(id: string) {
        return this.prisma.tenant.delete({
            where: { id },
        });
    }
}
