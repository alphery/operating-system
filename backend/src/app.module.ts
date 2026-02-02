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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RealtimeModule,
    // RedisModule, // Commented out - Install Redis first for caching
    StorageModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule { }
