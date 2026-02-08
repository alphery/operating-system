import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
    @Get()
    check() {
        const hasProjectId = !!process.env.FIREBASE_PROJECT_ID;
        const hasClientEmail = !!process.env.FIREBASE_CLIENT_EMAIL;
        const hasPrivateKey = !!process.env.FIREBASE_PRIVATE_KEY;
        const privateKeyLength = process.env.FIREBASE_PRIVATE_KEY?.length || 0;

        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            firebase: {
                hasProjectId,
                hasClientEmail,
                hasPrivateKey,
                privateKeyLength,
                isConfigured: hasProjectId && hasClientEmail && hasPrivateKey && privateKeyLength > 50,
            },
            database: {
                connected: !!process.env.DATABASE_URL,
            },
        };
    }
}
