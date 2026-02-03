
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ActivitiesService {
    constructor(private prisma: PrismaService) { }

    async findAll(tenantId: string) {
        return this.prisma.cRMActivity.findMany({
            where: { tenantId },
            orderBy: { dueDate: 'asc' },
            include: { client: { select: { name: true, company: true } } }
        });
    }

    async create(tenantId: string, data: any) {
        return this.prisma.cRMActivity.create({
            data: {
                ...data,
                tenantId
            }
        });
    }

    async update(tenantId: string, id: string, data: any) {
        return this.prisma.cRMActivity.update({
            where: { id },
            data
        });
    }

    async delete(tenantId: string, id: string) {
        return this.prisma.cRMActivity.delete({
            where: { id }
        });
    }
}
