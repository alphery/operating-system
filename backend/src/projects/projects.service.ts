import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
    constructor(private prisma: PrismaService) { }

    create(createProjectDto: CreateProjectDto) {
        return this.prisma.project.create({
            data: {
                ...createProjectDto,
                status: createProjectDto.status || 'Planning',
                priority: createProjectDto.priority || 'Medium',
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
        return this.prisma.project.update({
            where: { id },
            data: updateProjectDto,
        });
    }

    remove(id: string) {
        return this.prisma.project.delete({
            where: { id },
        });
    }
}
