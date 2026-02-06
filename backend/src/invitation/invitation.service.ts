import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class InvitationService {
    constructor(private prisma: PrismaService) { }

    /**
     * Create invitation to join tenant
     */
    async create(tenantId: string, invitedById: string, data: {
        email: string;
        role?: string;
    }) {
        // Check if user already exists in this tenant
        const existingUser = await this.prisma.platformUser.findFirst({
            where: {
                email: data.email,
                tenantMemberships: {
                    some: { tenantId }
                }
            },
        });

        if (existingUser) {
            throw new BadRequestException('User already exists in this workspace');
        }

        // Check for pending invitation
        const existingInvite = await this.prisma.invitation.findFirst({
            where: {
                email: data.email,
                tenantId,
                status: 'pending',
            },
        });

        if (existingInvite) {
            throw new BadRequestException('Invitation already sent to this email');
        }

        // Generate unique token
        const token = randomBytes(32).toString('hex');

        // Create invitation (expires in 7 days)
        const invitation = await this.prisma.invitation.create({
            data: {
                tenantId,
                email: data.email,
                role: data.role || 'member',
                invitedByUserId: invitedById,
                token,
                status: 'pending',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
            include: {
                tenant: true,
            },
        });

        return {
            ...invitation,
            invitationLink: `${process.env.FRONTEND_URL}/accept-invite/${token}`,
        };
    }

    /**
     * Get all invitations for a tenant
     */
    async findAll(tenantId: string) {
        return this.prisma.invitation.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get invitation by token
     */
    async findByToken(token: string) {
        return this.prisma.invitation.findUnique({
            where: { token },
            include: { tenant: true },
        });
    }

    /**
     * Cancel/revoke invitation
     */
    async cancel(id: string, tenantId: string) {
        const invitation = await this.prisma.invitation.findFirst({
            where: { id, tenantId },
        });

        if (!invitation) {
            throw new BadRequestException('Invitation not found');
        }

        return this.prisma.invitation.update({
            where: { id },
            data: { status: 'cancelled' },
        });
    }

    /**
     * Resend invitation (generates new token)
     */
    async resend(id: string, tenantId: string) {
        const invitation = await this.prisma.invitation.findFirst({
            where: { id, tenantId },
        });

        if (!invitation) {
            throw new BadRequestException('Invitation not found');
        }

        const newToken = randomBytes(32).toString('hex');

        return this.prisma.invitation.update({
            where: { id },
            data: {
                token: newToken,
                status: 'pending',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
    }
}
