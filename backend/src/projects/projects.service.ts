import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
    constructor(private prisma: PrismaService) { }

    create(createProjectDto: CreateProjectDto) {
        return this.prisma.project.create({
            data: {
                title: createProjectDto.title || createProjectDto.name,
                description: createProjectDto.description || createProjectDto.overview,
                status: createProjectDto.status || 'Planning',
                priority: createProjectDto.priority || 'Medium',
                budget: createProjectDto.budget,
                spent: createProjectDto.spent,
                progress: createProjectDto.progress,
                startDate: createProjectDto.startDate,
                endDate: createProjectDto.endDate,
                // store extra data in description or a flexible field if we had one. 
                // For now, simple mapping to avoid crashes.
            },
        });
    }

    findAll() {
        return this.prisma.project.findMany({
            include: {
                client: true,
                _count: {
                    select: { tasks: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
    }

    findOne(id: string) {
        return this.prisma.project.findUnique({
            where: { id },
            include: {
                client: true,
                tasks: {
                    include: { assignee: true }
                },
                // expenses: true,    // Enable after Prisma Generate
                // timesheets: true,  // Enable after Prisma Generate
                documents: true
            }
        });
    }

    update(id: string, updateProjectDto: any) {
        const { title, name, description, overview, status, priority, budget, spent, progress, startDate, endDate, clientId } = updateProjectDto;
        const data: any = {};
        if (title || name) data.title = title || name;
        if (description || overview) data.description = description || overview;
        if (status) data.status = status;
        if (priority) data.priority = priority;
        if (budget !== undefined) data.budget = budget;
        if (spent !== undefined) data.spent = spent;
        if (progress !== undefined) data.progress = progress;
        if (startDate) data.startDate = startDate;
        if (endDate) data.endDate = endDate;
        if (clientId) data.clientId = clientId;

        return this.prisma.project.update({
            where: { id },
            data: data,
        });
    }

    remove(id: string) {
        return this.prisma.project.delete({
            where: { id },
        });
    }
}
