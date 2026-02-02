import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ConfigModule } from '@nestjs/config';
import { RealtimeModule } from './realtime/realtime.module';
// import { RedisModule } from './redis/redis.module'; // Commented out - Install Redis first or use docker-compose
import { StorageModule } from './storage/storage.module';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';
// import { PrismaModule } from './prisma/prisma.module'; // Temporarily disabled - Prisma 7 compatibility
// import { UsersModule } from './users/users.module'; // Temporarily disabled - depends on Prisma

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // PrismaModule, //Temporarily disabled - Prisma 7 compatibility
    RealtimeModule,
    // RedisModule, // Commented out - Install Redis first or use docker-compose
    StorageModule,
    AuthModule,
    // UsersModule, // Temporarily disabled - depends on Prisma
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule { }
