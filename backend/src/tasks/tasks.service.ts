import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
    constructor(private prisma: PrismaService) { }

    create(tenantId: string, data: any) {
        return this.prisma.task.create({
            data: {
                tenantId,
                title: data.title,
                description: data.description,
                status: data.status,
                priority: data.priority,
                projectId: data.projectId,
                assignedTo: data.assignedTo,
                dueDate: data.dueDate,
            },
        });
    }

    findAll(tenantId: string) {
        return this.prisma.task.findMany({
            where: { tenantId },
            include: {
                project: {
                    select: { title: true, id: true }
                },
                assignee: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                }
            },
            orderBy: { updatedAt: 'desc' },
        });
    }

    findOne(id: string) {
        return this.prisma.task.findUnique({
            where: { id },
            include: {
                project: true,
                assignee: true,
            },
        });
    }

    update(id: string, data: any) {
        return this.prisma.task.update({
            where: { id },
            data,
        });
    }

    remove(id: string) {
        return this.prisma.task.delete({
            where: { id },
        });
    }
}
