import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private redisClient: Redis;

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        this.redisClient = new Redis({
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.get('REDIS_PORT', 6379),
        });
    }

    onModuleDestroy() {
        this.redisClient.quit();
    }

    async set(key: string, value: string, ttl?: number) {
        if (ttl) {
            await this.redisClient.set(key, value, 'EX', ttl);
        } else {
            await this.redisClient.set(key, value);
        }
    }

    async get(key: string) {
        return await this.redisClient.get(key);
    }

    async del(key: string) {
        await this.redisClient.del(key);
    }
}
