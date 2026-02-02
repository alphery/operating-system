import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {
        super({
            // @ts-ignore
            datasources: {
                db: {
                    url: process.env.DATABASE_URL,
                },
            },
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
