import { Controller, Post, Body, Get, Param, Patch, Delete } from '@nestjs/common';
import { TenantService } from './tenant.service';

@Controller('tenants')
export class TenantController {
    constructor(private readonly tenantService: TenantService) { }

    @Post()
    async create(@Body() data: { name: string; plan?: string; allowedApps?: string[] }) {
        return this.tenantService.createTenant(data);
    }

    @Get()
    async findAll() {
        return this.tenantService.findAllTenants();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.tenantService.getTenant(id);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() data: any) {
        return this.tenantService.updateTenant(id, data);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.tenantService.deleteTenant(id);
    }
}
