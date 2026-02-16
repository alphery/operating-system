import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth-simple.service';
import { AuthController } from './auth-simple.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PlatformGuard, TenantGuard, AppPermissionGuard, AuthGuard } from './guards';

@Module({
    imports: [
        PrismaModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
            signOptions: { expiresIn: '7d' }, // Token valid for 7 days
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, AuthGuard, PlatformGuard, TenantGuard, AppPermissionGuard],
    exports: [AuthService, AuthGuard, JwtModule, PlatformGuard, TenantGuard, AppPermissionGuard],
})
export class AuthModule { }
