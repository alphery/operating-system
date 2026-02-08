import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('users')
export class UsersController {
    constructor(private prisma: PrismaService) { }

    @Get()
    async getAllUsers() {
        return await this.prisma.platformUser.findMany({
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                isGod: true,
                createdAt: true,
            },
        });
    }

    @Get(':id')
    async getUser(@Param('id') id: string) {
        return await this.prisma.platformUser.findUnique({
            where: { id },
            include: {
                tenantMemberships: {
                    include: { tenant: true }
                }
            },
        });
    }

    @Post()
    async createUser(@Body() data: any) {
        // Generate custom UID (simple implementation)
        const count = await this.prisma.platformUser.count();
        const customUid = `AU${String(count + 1).padStart(6, '0')}`;

        return await this.prisma.platformUser.create({
            data: {
                customUid,
                firebaseUid: data.firebaseUid,
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                isGod: data.isGod || false,
                isActive: true,
            },
        });
    }
}
