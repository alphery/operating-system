
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EntityService {
    constructor(private prisma: PrismaService) { }

    // === SCHEMA DEFINITION ===

    /**
     * Create a new Entity Definition (e.g. "Patient", "Project")
     */
    async createDefinition(tenantId: string, data: any) {
        const { name, icon, description, fields } = data;
        const slug = name.toLowerCase().replace(/ /g, '-');

        return this.prisma.entityDefinition.create({
            data: {
                tenantId,
                name,
                slug,
                icon,
                description,
                fields: {
                    create: fields.map((f: any, index: number) => ({
                        name: f.name,
                        key: f.key,
                        type: f.type,
                        isRequired: f.isRequired,
                        options: f.options,
                        order: index
                    }))
                }
            },
            include: {
                fields: true
            }
        });
    }

    async getDefinition(tenantId: string, slug: string) {
        const def = await this.prisma.entityDefinition.findUnique({
            where: {
                tenantId_slug: { tenantId, slug }
            },
            include: {
                fields: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!def) throw new NotFoundException(`Entity '${slug}' not found`);
        return def;
    }

    // === RECORD MANAGEMENT ===

    /**
     * Create a dynamic record for an entity
     */
    async createRecord(tenantId: string, slug: string, data: any, userId: string) {
        const def = await this.getDefinition(tenantId, slug);

        // TODO: Add validation against def.fields here

        return this.prisma.entityRecord.create({
            data: {
                tenantId,
                entityDefId: def.id,
                data: data,
                createdBy: userId,
                ownerId: userId // Default owner is creator
            }
        });
    }

    /**
     * Get all records for an entity
     */
    async findAllRecords(tenantId: string, slug: string) {
        const def = await this.getDefinition(tenantId, slug);

        return this.prisma.entityRecord.findMany({
            where: {
                tenantId,
                entityDefId: def.id
            },
            orderBy: { createdAt: 'desc' }
        });
    }
}
