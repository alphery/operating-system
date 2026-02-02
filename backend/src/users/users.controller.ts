import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('users')
export class UsersController {
    constructor(private prisma: PrismaService) { }

    @Get()
    async getAllUsers() {
        return await this.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
            },
        });
    }

    @Get(':id')
    async getUser(@Param('id') id: string) {
        return await this.prisma.user.findUnique({
            where: { id },
            include: {
                organization: true,
                files: true,
            },
        });
    }

    @Post()
    async createUser(@Body() data: any) {
        return await this.prisma.user.create({
            data: {
                email: data.email,
                password: data.password,
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role || 'USER',
            },
        });
    }
}
