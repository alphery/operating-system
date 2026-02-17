import { Module } from '@nestjs/common';
import { PlatformController, TenantController } from './platform.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
    imports: [PrismaModule, AuthModule, RealtimeModule],
    controllers: [PlatformController, TenantController],
})
export class PlatformModule { }
