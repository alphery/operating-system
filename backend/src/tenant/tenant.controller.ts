import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { TenantService } from './tenant.service';

@Controller('tenants')
export class TenantController {
    constructor(private readonly tenantService: TenantService) { }

    /**
     * POST /api/tenants
     * Create a new organization/company
     * 
     * Example:
     * {
     *   "name": "Acme Corporation",
     *   "subdomain": "acme",
     *   "plan": "pro",
     *   "adminEmail": "admin@acme.com",
     *   "adminName": "John Doe"
     * }
     */
    @Post()
    create(@Body() createTenantDto: any) {
        return this.tenantService.create(createTenantDto);
    }

    /**
     * GET /api/tenants
     * List all tenants (for super admin dashboard)
     */
    @Get()
    findAll() {
        return this.tenantService.findAll();
    }

    /**
     * GET /api/tenants/:id
     * Get tenant details
     */
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.tenantService.findById(id);
    }

    /**
     * GET /api/tenants/subdomain/:subdomain
     * Find tenant by subdomain (for routing)
     */
    @Get('subdomain/:subdomain')
    findBySubdomain(@Param('subdomain') subdomain: string) {
        return this.tenantService.findBySubdomain(subdomain);
    }

    /**
     * PATCH /api/tenants/:id
     * Update tenant settings
     */
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateTenantDto: any) {
        return this.tenantService.update(id, updateTenantDto);
    }

    /**
     * DELETE /api/tenants/:id
     * Delete tenant and all associated data
     */
    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.tenantService.delete(id);
    }
}
