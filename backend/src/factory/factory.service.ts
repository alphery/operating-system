import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FactoryService {
    constructor(private prisma: PrismaService) { }

    // === TEMPLATE MANAGEMENT ===

    async createTemplate(data: any) {
        return this.prisma.industryTemplate.create({
            data: {
                name: data.name,
                slug: data.slug,
                description: data.description,
                modules: data.modules, // JSON array of definitions
                workflows: data.workflows, // JSON
                dashboards: data.dashboards, // JSON
                isPublic: data.isPublic
            }
        });
    }

    async getTemplates() {
        return this.prisma.industryTemplate.findMany({
            where: { isPublic: true }
        });
    }

    // === INSTANTIATION ENGINE ===

    /**
     * The Magic Method: Turns a generic tenant into a specific Industry ERP
     */
    async instantiateTenant(tenantId: string, templateSlug: string, userId: string) {
        const template = await this.prisma.industryTemplate.findUnique({
            where: { slug: templateSlug }
        });

        if (!template) throw new NotFoundException(`Template '${templateSlug}' not found`);

        // 1. Create Modules (EntityDefinitions)
        const modules = template.modules as any[];
        const moduleMap = new Map<string, string>(); // Old Slug -> New ID

        for (const mod of modules) {
            // Check if exists? Skip for now, assume fresh or overwrite
            const def = await this.prisma.entityDefinition.create({
                data: {
                    tenantId,
                    name: mod.name,
                    slug: mod.slug,
                    icon: mod.icon,
                    description: mod.description,
                    fields: {
                        create: mod.fields.map((f: any, idx: number) => ({
                            name: f.name,
                            key: f.key,
                            type: f.type,
                            options: f.options,
                            isRequired: f.isRequired,
                            order: idx
                        }))
                    }
                }
            });
            moduleMap.set(mod.slug, def.id);
        }

        // 2. Create Workflows
        const workflows = template.workflows as any[];
        if (workflows) {
            for (const wf of workflows) {
                await this.prisma.workflow.create({
                    data: {
                        tenantId,
                        name: wf.name,
                        moduleSlug: wf.moduleSlug,
                        trigger: wf.trigger,
                        triggerField: wf.triggerField,
                        isActive: true,
                        actions: {
                            create: wf.actions.map((act: any, idx: number) => ({
                                type: act.type,
                                order: idx,
                                config: act.config
                            }))
                        }
                    }
                });
            }
        }

        // 3. Create Dashboards
        const dashboards = template.dashboards as any[];
        if (dashboards) {
            for (const db of dashboards) {
                await this.prisma.dashboard.create({
                    data: {
                        tenantId,
                        name: db.name,
                        role: db.role,
                        widgets: {
                            create: db.widgets.map((w: any) => ({
                                title: w.title,
                                type: w.type,
                                moduleSlug: w.moduleSlug,
                                config: w.config,
                                position: w.position
                            }))
                        }
                    }
                });
            }
        }

        return { success: true, message: `Tenant instantiated with ${template.name}` };
    }
}
