import { Controller, Get, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('admin')
export class AdminController {
    constructor(private prisma: PrismaService) { }

    @Get('check-user/:uid')
    async checkUser(@Param('uid') uid: string) {
        const user = await this.prisma.platformUser.findUnique({
            where: { customUid: uid }
        });

        if (!user) {
            return { error: 'User not found' };
        }

        return {
            customUid: user.customUid,
            email: user.email,
            isActive: user.isActive,
            settings: user.settings,
            settingsType: typeof user.settings,
            hasPassword: !!(user.settings as any)?.password,
            passwordValue: (user.settings as any)?.password
        };
    }
}
