import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { FactoryService } from './factory.service';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Assuming this exists

@Controller('factory')
export class FactoryController {
    constructor(private readonly factoryService: FactoryService) { }

    @Post('templates')
    // @UseGuards(JwtAuthGuard) // Protect admin routes
    async createTemplate(@Body() data: any) {
        return this.factoryService.createTemplate(data);
    }

    @Get('templates')
    async getTemplates() {
        return this.factoryService.getTemplates();
    }

    @Post('instantiate')
    // @UseGuards(JwtAuthGuard)
    async instantiate(@Body() body: { tenantId: string; templateSlug: string }, @Request() req) {
        // In real app, get tenantId from JWT user
        return this.factoryService.instantiateTenant(body.tenantId, body.templateSlug, 'admin');
    }
}
