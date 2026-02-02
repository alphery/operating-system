import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ConfigModule } from '@nestjs/config';
import { RealtimeModule } from './realtime/realtime.module';
// import { RedisModule } from './redis/redis.module'; // Commented out - Install Redis first or use docker-compose
import { StorageModule } from './storage/storage.module';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { CrmModule } from './crm/crm.module';
import { SalesModule } from './sales/sales.module';
import { DocumentsModule } from './documents/documents.module';
import { TenantModule } from './core/tenant/tenant.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    TenantModule,
    RealtimeModule,
    // RedisModule, // Commented out - Install Redis first for caching
    StorageModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    CrmModule,
    SalesModule,
    DocumentsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule { }
