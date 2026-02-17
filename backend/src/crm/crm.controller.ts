import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { CRMTemplatesService } from './templates.service';
import { CRMRecordsService } from './records.service';

@Controller('crm')
export class CRMController {
    constructor(
        private readonly templatesService: CRMTemplatesService,
        private readonly recordsService: CRMRecordsService,
    ) { }

    // ═══════════════════════════════════════════════════════════
    // TEMPLATE ENDPOINTS
    // ═══════════════════════════════════════════════════════════

    @Get('templates')
    async getAllTemplates() {
        return this.templatesService.getAllTemplates();
    }

    @Get('templates/:slug')
    async getTemplate(@Param('slug') slug: string) {
        return this.templatesService.getTemplateBySlug(slug);
    }

    @Get('config/:tenantId')
    async getTenantConfig(@Param('tenantId') tenantId: string) {
        return this.templatesService.getTenantConfig(tenantId);
    }

    @Post('config/:tenantId')
    async setTenantTemplate(
        @Param('tenantId') tenantId: string,
        @Body() body: { templateSlug: string; userId: string },
    ) {
        return this.templatesService.setTenantTemplate(tenantId, body.templateSlug, body.userId);
    }

    // ═══════════════════════════════════════════════════════════
    // RECORD ENDPOINTS
    // ═══════════════════════════════════════════════════════════

    @Get(':tenantId/:moduleSlug/records')
    async getRecords(
        @Param('tenantId') tenantId: string,
        @Param('moduleSlug') moduleSlug: string,
        @Query('search') search?: string,
    ) {
        if (search) {
            return this.recordsService.searchRecords(tenantId, moduleSlug, search);
        }
        return this.recordsService.getRecords(tenantId, moduleSlug);
    }

    @Get(':tenantId/:moduleSlug/records/:recordId')
    async getRecord(
        @Param('tenantId') tenantId: string,
        @Param('moduleSlug') moduleSlug: string,
        @Param('recordId') recordId: string,
    ) {
        return this.recordsService.getRecord(tenantId, moduleSlug, recordId);
    }

    @Post(':tenantId/:moduleSlug/records')
    async createRecord(
        @Param('tenantId') tenantId: string,
        @Param('moduleSlug') moduleSlug: string,
        @Body() body: { data: any; userId: string },
    ) {
        return this.recordsService.createRecord(tenantId, moduleSlug, body.data, body.userId);
    }

    @Put(':tenantId/:moduleSlug/records/:recordId')
    async updateRecord(
        @Param('tenantId') tenantId: string,
        @Param('moduleSlug') moduleSlug: string,
        @Param('recordId') recordId: string,
        @Body() body: { data: any; userId: string },
    ) {
        return this.recordsService.updateRecord(tenantId, moduleSlug, recordId, body.data, body.userId);
    }

    @Delete(':tenantId/:moduleSlug/records/:recordId')
    async deleteRecord(
        @Param('tenantId') tenantId: string,
        @Param('moduleSlug') moduleSlug: string,
        @Param('recordId') recordId: string,
        @Body() body: { userId: string },
    ) {
        return this.recordsService.deleteRecord(tenantId, moduleSlug, recordId, body.userId);
    }
}
