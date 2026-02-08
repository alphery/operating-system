import { Controller, Post, Body } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('admin')
export class AdminController {
    constructor(private prisma: PrismaService) { }

    @Post('set-god-password')
    async setGodPassword(@Body() body: { secret: string; password: string }) {
        // Basic security - check a secret key
        if (body.secret !== 'ALPHERY_ADMIN_2026') {
            throw new Error('Unauthorized');
        }

        const user = await this.prisma.platformUser.update({
            where: { customUid: 'AU000001' },
            data: {
                settings: {
                    password: body.password
                }
            }
        });

        return {
            success: true,
            message: 'Password updated for AU000001',
            customUid: user.customUid,
            email: user.email
        };
    }
}
