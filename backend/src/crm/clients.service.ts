import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientsService {
    constructor(private prisma: PrismaService) { }

    create(data: any) {
        return this.prisma.client.create({
            data: {
                name: data.name,
                email: data.email,
                company: data.company,
                phone: data.phone,
                address: data.address,
            },
        });
    }

    findAll() {
        return this.prisma.client.findMany({
            include: {
                _count: {
                    select: { projects: true, quotations: true }
                }
            },
            orderBy: { updatedAt: 'desc' },
        });
    }

    findOne(id: string) {
        return this.prisma.client.findUnique({
            where: { id },
            include: {
                projects: true,
                quotations: true,
                invoices: true
            },
        });
    }

    update(id: string, data: any) {
        return this.prisma.client.update({
            where: { id },
            data,
        });
    }

    remove(id: string) {
        return this.prisma.client.delete({
            where: { id },
        });
    }
}
