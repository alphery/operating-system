
import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('admin')
export class DiagnoseController {
    constructor(private prisma: PrismaService) { }

    @Get('diagnose-login')
    async diagnose(@Query('uid') uid: string) {
        if (!uid) return { error: 'Provide ?uid=xxx' };

        const user = await this.prisma.platformUser.findUnique({
            where: { customUid: uid },
        });

        if (!user) return { status: 'USER_NOT_FOUND', uid };

        const settings = user.settings as any;
        const password = settings?.password;

        return {
            status: 'USER_FOUND',
            uid: user.customUid,
            email: user.email,
            isActive: user.isActive,
            hasPassword: !!password,
            passwordValue: password, // For debugging only!
            backendTime: new Date().toISOString(),
            nodeEnv: process.env.NODE_ENV
        };
    }
}
