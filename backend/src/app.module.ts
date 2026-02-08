import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ConfigModule } from '@nestjs/config';
import { RealtimeModule } from './realtime/realtime.module';
// import { RedisModule } from './redis/redis.module'; // Commented out - Install Redis first or use docker-compose
import { StorageModule } from './storage/storage.module';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';
import { AdminController } from './admin/admin.controller';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { CrmModule } from './crm/crm.module';
import { SalesModule } from './sales/sales.module';
import { DocumentsModule } from './documents/documents.module';
import { TenantModule } from './core/tenant/tenant.module';
import { EntityModule } from './core/entity/entity.module';
import { InvitationModule } from './invitation/invitation.module';
import { AuditModule } from './audit/audit.module';
import { NotificationModule } from './notification/notification.module';
import { EmailModule } from './email/email.module';
import { RoleModule } from './role/role.module';
import { FactoryModule } from './factory/factory.module';
import { PlatformModule } from './platform/platform.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    TenantModule,
    RealtimeModule,
    // RedisModule, // Commented out - Install Redis first for caching
    StorageModule,
    AuthModule,
    PlatformModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    CrmModule,
    SalesModule,
    DocumentsModule,
    EntityModule,
    InvitationModule,
    AuditModule,
    NotificationModule,
    EmailModule,
    RoleModule,
    FactoryModule,
  ],
  controllers: [AppController, HealthController, AdminController],
  providers: [AppService],
})
export class AppModule { }
