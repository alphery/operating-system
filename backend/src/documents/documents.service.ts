import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, createDocumentDto: CreateDocumentDto) {
        const { title, type, content, tenantId } = createDocumentDto;

        return this.prisma.document.create({
            data: {
                title,
                type, // 'DOCUMENT', 'SPREADSHEET', 'PRESENTATION'
                content: content || {},
                owner: { connect: { id: userId } },
                tenant: tenantId ? { connect: { id: tenantId } } : undefined,
                collaborators: {
                    create: {
                        userId,
                        permission: 'OWNER',
                    },
                },
                versions: {
                    create: {
                        version: 1,
                        content: content || {},
                        createdBy: userId,
                    },
                },
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        displayName: true,
                        email: true,
                        photoUrl: true,
                    },
                },
                collaborators: true,
            },
        });
    }

    async findAll(userId: string, tenantId?: string) {
        // specific to user or tenant?
        // User sees documents they own OR contribute to.
        return this.prisma.document.findMany({
            where: {
                OR: [
                    { ownerId: userId },
                    { collaborators: { some: { userId } } },
                    { isPublic: true }, // Maybe? Or just shared links
                ],
                AND: tenantId ? { tenantId } : {},
            },
            orderBy: { updatedAt: 'desc' },
            include: {
                owner: {
                    select: { displayName: true, photoUrl: true },
                },
            },
        });
    }

    async findOne(id: string, userId: string) {
        const document = await this.prisma.document.findUnique({
            where: { id },
            include: {
                owner: {
                    select: { id: true, displayName: true, email: true, photoUrl: true },
                },
                collaborators: {
                    include: {
                        user: {
                            select: { id: true, displayName: true, photoUrl: true },
                        },
                    },
                },
            },
        });

        if (!document) {
            throw new NotFoundException(`Document with ID ${id} not found`);
        }

        // Check permission
        const isOwner = document.ownerId === userId;
        const isCollaborator = document.collaborators.some((c) => c.userId === userId);
        const isPublic = document.isPublic;

        if (!isOwner && !isCollaborator && !isPublic) {
            throw new ForbiddenException('You do not have permission to view this document');
        }

        return document;
    }

    async update(id: string, userId: string, updateDocumentDto: UpdateDocumentDto) {
        // Check permission first
        const doc = await this.findOne(id, userId); // Will throw if not allowed

        // Verify edit permission logic here if stricter roles exist

        // Create new version if content changed significantly? 
        // For now, simple update. Real-time updates might skip this generic update.

        return this.prisma.document.update({
            where: { id },
            data: {
                ...updateDocumentDto,
                lastEditedBy: userId,
            },
        });
    }

    async remove(id: string, userId: string) {
        const doc = await this.prisma.document.findUnique({ where: { id } });
        if (!doc) throw new NotFoundException('Document not found');
        if (doc.ownerId !== userId) throw new ForbiddenException('Only owner can delete');

        return this.prisma.document.delete({ where: { id } });
    }

    // Versioning
    async createVersion(id: string, userId: string, content: any) {
        const doc = await this.prisma.document.findUnique({ where: { id } });
        if (!doc) throw new NotFoundException();

        const newVersion = doc.version + 1;

        // Transaction to update doc version and create history
        return this.prisma.$transaction([
            this.prisma.document.update({
                where: { id },
                data: { version: newVersion, content },
            }),
            this.prisma.documentVersion.create({
                data: {
                    documentId: id,
                    version: newVersion,
                    content,
                    createdBy: userId,
                },
            }),
        ]);
    }
}
