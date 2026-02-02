import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
    @Get()
    check() {
        return {
            status: 'OK',
            timestamp: new Date().toISOString(),
            service: 'Alphery OS Backend',
            version: '2.0.0',
        };
    }
}
