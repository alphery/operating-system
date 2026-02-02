import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {
        super({
            log: ['info', 'warn', 'error'],
        });
    }

    async onModuleInit() {
        try {
            await this.$connect();
            console.log('✅ [Prisma] Connected to database');
        } catch (error) {
            console.error('❌ [Prisma] Failed to connect:', error.message);
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
