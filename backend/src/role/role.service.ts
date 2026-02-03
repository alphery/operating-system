import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoleService {
    constructor(private prisma: PrismaService) { }

    /**
     * Create a custom role with field-level permissions
     */
    async create(tenantId: string, data: {
        name: string;
        description?: string;
        permissions: any; // JSON object with permissions
    }) {
        // Check if role already exists
        const existing = await this.prisma.customRole.findFirst({
            where: {
                tenantId,
                name: data.name,
            },
        });

        if (existing) {
            throw new BadRequestException('Role with this name already exists');
        }

        return this.prisma.customRole.create({
            data: {
                tenantId,
                name: data.name,
                description: data.description,
                permissions: data.permissions,
                isSystem: false,
            },
        });
    }

    /**
     * Get all roles for tenant
     */
    async findAll(tenantId: string) {
        return this.prisma.customRole.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' },
        });
    }

    /**
     * Get role by ID
     */
    async findOne(id: string, tenantId: string) {
        return this.prisma.customRole.findFirst({
            where: { id, tenantId },
        });
    }

    /**
     * Update role permissions
     */
    async update(id: string, tenantId: string, data: {
        name?: string;
        description?: string;
        permissions?: any;
    }) {
        const role = await this.findOne(id, tenantId);

        if (role?.isSystem) {
            throw new BadRequestException('Cannot modify system roles');
        }

        return this.prisma.customRole.update({
            where: { id },
            data,
        });
    }

    /**
     * Delete custom role
     */
    async delete(id: string, tenantId: string) {
        const role = await this.findOne(id, tenantId);

        if (role?.isSystem) {
            throw new BadRequestException('Cannot delete system roles');
        }

        return this.prisma.customRole.delete({
            where: { id },
        });
    }

    /**
     * Check if user has permission for an action
     */
    async checkPermission(
        roleId: string,
        entity: string,
        action: 'read' | 'write' | 'delete',
        field?: string
    ): Promise<boolean> {
        const role = await this.prisma.customRole.findUnique({
            where: { id: roleId },
        });

        if (!role) return false;

        const permissions = role.permissions as any;
        const entityPerms = permissions[entity];

        if (!entityPerms) return false;

        // Check action permission
        if (!entityPerms[action]) return false;

        // Check field-level permission if specified
        if (field && entityPerms.fields) {
            return entityPerms.fields[field] !== false;
        }

        return true;
    }

    /**
     * Filter object fields based on role permissions
     */
    async filterFields(roleId: string, entity: string, data: any): Promise<any> {
        const role = await this.prisma.customRole.findUnique({
            where: { id: roleId },
        });

        if (!role) return data;

        const permissions = role.permissions as any;
        const entityPerms = permissions[entity];

        if (!entityPerms?.fields) return data;

        // Remove fields user doesn't have access to
        const filtered = { ...data };
        Object.keys(entityPerms.fields).forEach(field => {
            if (entityPerms.fields[field] === false) {
                delete filtered[field];
            }
        });

        return filtered;
    }

    /**
     * Seed system roles (owner, admin, member, viewer)
     */
    async seedSystemRoles(tenantId: string) {
        const systemRoles = [
            {
                name: 'owner',
                description: 'Full access to everything',
                permissions: { '*': { read: true, write: true, delete: true } },
                isSystem: true,
            },
            {
                name: 'admin',
                description: 'Manage data and invite users',
                permissions: { '*': { read: true, write: true, delete: true } },
                isSystem: true,
            },
            {
                name: 'member',
                description: 'Create and edit own data',
                permissions: {
                    client: { read: true, write: 'own', delete: false },
                    lead: { read: true, write: 'own', delete: false },
                    project: { read: true, write: 'own', delete: false },
                },
                isSystem: true,
            },
            {
                name: 'viewer',
                description: 'Read-only access',
                permissions: { '*': { read: true, write: false, delete: false } },
                isSystem: true,
            },
        ];

        for (const role of systemRoles) {
            await this.prisma.customRole.upsert({
                where: {
                    tenantId_name: {
                        tenantId,
                        name: role.name,
                    },
                },
                create: {
                    tenantId,
                    ...role,
                },
                update: {},
            });
        }
    }
}
