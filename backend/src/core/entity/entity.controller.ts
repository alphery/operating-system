
import { Controller, Get, Post, Body, Param, Request } from '@nestjs/common';
import { EntityService } from './entity.service';

@Controller('entity')
export class EntityController {
    constructor(private readonly entityService: EntityService) { }

    // === SCHEMA ENDPOINTS ===

    @Post('schema')
    async createSchema(@Request() req, @Body() body: any) {
        const tenantId = req.user?.tenantId || 'default-tenant';
        return this.entityService.createDefinition(tenantId, body);
    }

    @Get('schema/:slug')
    async getSchema(@Request() req, @Param('slug') slug: string) {
        const tenantId = req.user?.tenantId || 'default-tenant';
        return this.entityService.getDefinition(tenantId, slug);
    }

    // === DATA ENDPOINTS ===

    @Post(':slug')
    async createRecord(
        @Request() req,
        @Param('slug') slug: string,
        @Body() body: any
    ) {
        const tenantId = req.user?.tenantId || 'default-tenant';
        const userId = req.user?.id;
        return this.entityService.createRecord(tenantId, slug, body, userId);
    }

    @Get(':slug')
    async getRecords(@Request() req, @Param('slug') slug: string) {
        const tenantId = req.user?.tenantId || 'default-tenant';
        return this.entityService.findAllRecords(tenantId, slug);
    }
}
