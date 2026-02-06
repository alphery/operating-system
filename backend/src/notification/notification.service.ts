import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
    constructor(private prisma: PrismaService) { }

    /**
     * Create notification for user
     */
    async create(params: {
        tenantId: string;
        userId: string;
        type: string;
        title: string;
        message: string;
        link?: string;
    }) {
        return this.prisma.notification.create({
            data: {
                tenantId: params.tenantId,
                userId: params.userId,
                type: params.type,
                title: params.title,
                message: params.message,
                link: params.link,
            },
        });
    }

    /**
     * Get unread notifications for user
     */
    async findUnread(tenantId: string, userId: string) {
        return this.prisma.notification.findMany({
            where: {
                tenantId,
                userId,
                read: false,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get all notifications for user
     */
    async findAll(tenantId: string, userId: string, limit = 50) {
        return this.prisma.notification.findMany({
            where: {
                tenantId,
                userId,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    /**
     * Mark notification as read
     */
    async markAsRead(id: string, userId: string) {
        return this.prisma.notification.update({
            where: { id },
            data: { read: true },
        });
    }

    /**
     * Mark all as read for user
     */
    async markAllAsRead(tenantId: string, userId: string) {
        return this.prisma.notification.updateMany({
            where: {
                tenantId,
                userId,
                read: false,
            },
            data: { read: true },
        });
    }

    /**
     * Delete notification
     */
    async delete(id: string, userId: string) {
        return this.prisma.notification.delete({
            where: { id },
        });
    }

    /**
     * Broadcast notification to all team members
     */
    async broadcast(params: {
        tenantId: string;
        type: string;
        title: string;
        message: string;
        link?: string;
    }) {
        // Get all users in tenant
        const users = await this.prisma.platformUser.findMany({
            where: {
                tenantMemberships: {
                    some: { tenantId: params.tenantId }
                }
            },
            select: { id: true },
        });

        // Create notification for each user
        const notifications = users.map(user => ({
            tenantId: params.tenantId,
            userId: user.id,
            type: params.type,
            title: params.title,
            message: params.message,
            link: params.link,
            read: false,
        }));

        return this.prisma.notification.createMany({
            data: notifications,
        });
    }
}
