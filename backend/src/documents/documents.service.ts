import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentsService {
    constructor(private prisma: PrismaService) { }

    create(data: any) {
        return this.prisma.document.create({
            data: {
                title: data.title,
                type: data.type,
                url: data.fileUrl || 'https://example.com/placeholder.pdf', // Mock for now if no upload logic
                projectId: data.projectId || undefined,
                uploadedBy: data.uploadedBy || 'User',
            },
        });
    }

    findAll() {
        return this.prisma.document.findMany({
            include: {
                project: true
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    findOne(id: string) {
        return this.prisma.document.findUnique({
            where: { id },
            include: {
                project: true
            },
        });
    }

    remove(id: string) {
        return this.prisma.document.delete({
            where: { id },
        });
    }
}
