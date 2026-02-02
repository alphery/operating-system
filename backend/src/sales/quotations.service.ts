import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuotationsService {
    constructor(private prisma: PrismaService) { }

    create(data: any) {
        return this.prisma.quotation.create({
            data: {
                title: data.title,
                clientId: data.clientId,
                items: data.items, // Ensure frontend sends valid JSON array
                total: data.total,
                status: data.status || 'Draft',
                validUntil: data.validUntil,
            },
        });
    }

    findAll() {
        return this.prisma.quotation.findMany({
            include: {
                client: true
            },
            orderBy: { updatedAt: 'desc' },
        });
    }

    findOne(id: string) {
        return this.prisma.quotation.findUnique({
            where: { id },
            include: {
                client: true
            },
        });
    }

    update(id: string, data: any) {
        return this.prisma.quotation.update({
            where: { id },
            data,
        });
    }

    remove(id: string) {
        return this.prisma.quotation.delete({
            where: { id },
        });
    }
}
