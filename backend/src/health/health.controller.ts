import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as os from 'os';
import firebaseAdmin from '../firebase/firebase.config';

@Controller('health')
export class HealthController {
    constructor(private readonly prisma: PrismaService) { }

    @Get()
    async check() {
        // Measure DB latency
        const start = Date.now();
        let dbStatus = 'disconnected';
        let dbError = null;
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            dbStatus = 'connected';
        } catch (e) {
            dbStatus = 'error';
            dbError = e.message || 'Connection failed';
        }
        const dbLatency = Date.now() - start;

        // Check Firebase Status
        const firebaseStatus = firebaseAdmin.apps?.length
            ? 'connected'
            : (process.env.FIREBASE_PRIVATE_KEY ? 'error' : 'mock_mode');

        const firebaseError = firebaseStatus === 'error' ? 'Initialization failed (check logs)' : null;

        // System Metrics
        const uptime = Math.floor(process.uptime());
        const memoryUsage = process.memoryUsage();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();

        // Approximate CPU Load % (very rough for Node, but usable for demo)
        // Using loadavg[0] (1 min avg) normalized by CPU coung
        const cpus = os.cpus().length;
        const loadAvg = os.loadavg()[0];
        const cpuLoad = Math.min(100, Math.round((loadAvg / cpus) * 100));

        // Memory usage %
        const memUsagePercent = Math.round(((totalMem - freeMem) / totalMem) * 100);

        // Process specific memory (RSS) in MB
        const processMem = Math.round(memoryUsage.rss / 1024 / 1024);

        return {
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime,
            system: {
                cpuLoad,
                memoryUsage: memUsagePercent, // System wide
                processMemory: processMem,     // Node process
                platform: os.platform(),
                arch: os.arch()
            },
            database: {
                status: dbStatus,
                latency: dbLatency,
                error: dbError
            },
            firebase: {
                status: firebaseStatus,
                error: firebaseError
            },
            version: '2.4.0',
        };
    }
}
