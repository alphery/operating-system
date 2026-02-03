
import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { ActivitiesService } from './activities.service';

@Controller('activities')
export class ActivitiesController {
    constructor(private readonly activitiesService: ActivitiesService) { }

    @Post()
    create(@Request() req, @Body() data: any) {
        const tenantId = req.user?.tenantId || 'default-tenant';
        return this.activitiesService.create(tenantId, data);
    }

    @Get()
    findAll(@Request() req) {
        const tenantId = req.user?.tenantId || 'default-tenant';
        return this.activitiesService.findAll(tenantId);
    }

    @Patch(':id')
    update(@Request() req, @Param('id') id: string, @Body() data: any) {
        const tenantId = req.user?.tenantId || 'default-tenant';
        return this.activitiesService.update(tenantId, id, data);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        const tenantId = req.user?.tenantId || 'default-tenant';
        return this.activitiesService.delete(tenantId, id);
    }
}
