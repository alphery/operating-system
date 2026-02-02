import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class ClientsService {
    constructor(
        private prisma: PrismaService,
        private realtimeGateway: RealtimeGateway,
    ) { }

    async create(tenantId: string, data: any) {
        const client = await this.prisma.client.create({
            data: {
                tenantId,
                name: data.name,
                email: data.email,
                company: data.company,
                phone: data.phone,
                address: data.address,
                status: data.status || 'New',
                value: Number(data.value) || 0,
                priority: data.priority || 'Medium',
            },
        });

        // 🔥 REALTIME: Broadcast to all users in this tenant
        this.realtimeGateway.server
            .to(`tenant:${tenantId}`)
            .emit('client:created', client);

        return client;
    }

    async findAll(tenantId: string) {
        return this.prisma.client.findMany({
            where: { tenantId },
            include: {
                _count: {
                    select: { projects: true, quotations: true }
                }
            },
            orderBy: { updatedAt: 'desc' },
        });
    }

    async findOne(tenantId: string, id: string) {
        return this.prisma.client.findFirst({
            where: { id, tenantId },
            include: {
                projects: true,
                quotations: true,
                invoices: true
            },
        });
    }

    async update(tenantId: string, id: string, data: any) {
        const client = await this.prisma.client.update({
            where: { id },
            data: {
                ...data,
                // Ensure tenant cannot be changed
                tenantId,
            },
        });

        // 🔥 REALTIME: Broadcast update
        this.realtimeGateway.server
            .to(`tenant:${tenantId}`)
            .emit('client:updated', client);

        return client;
    }

    async remove(tenantId: string, id: string) {
        await this.prisma.client.delete({
            where: { id },
        });

        // 🔥 REALTIME: Broadcast deletion
        this.realtimeGateway.server
            .to(`tenant:${tenantId}`)
            .emit('client:deleted', { id });

        return { success: true, id };
    }
}
