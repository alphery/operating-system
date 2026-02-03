import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { RoleService } from './role.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('roles')
@UseGuards(RolesGuard)
export class RoleController {
    constructor(private readonly roleService: RoleService) { }

    /**
     * POST /api/roles
     * Create custom role (owner/admin only)
     */
    @Post()
    @Roles('owner', 'admin')
    create(@Request() req, @Body() createRoleDto: {
        name: string;
        description?: string;
        permissions: any;
    }) {
        const tenantId = req.user?.tenantId || 'default-tenant';
        return this.roleService.create(tenantId, createRoleDto);
    }

    /**
     * GET /api/roles
     * List all roles
     */
    @Get()
    @Roles('owner', 'admin')
    findAll(@Request() req) {
        const tenantId = req.user?.tenantId || 'default-tenant';
        return this.roleService.findAll(tenantId);
    }

    /**
     * GET /api/roles/:id
     * Get role details
     */
    @Get(':id')
    @Roles('owner', 'admin')
    findOne(@Request() req, @Param('id') id: string) {
        const tenantId = req.user?.tenantId || 'default-tenant';
        return this.roleService.findOne(id, tenantId);
    }

    /**
     * PUT /api/roles/:id
     * Update role (owner/admin only)
     */
    @Put(':id')
    @Roles('owner', 'admin')
    update(@Request() req, @Param('id') id: string, @Body() updateRoleDto: {
        name?: string;
        description?: string;
        permissions?: any;
    }) {
        const tenantId = req.user?.tenantId || 'default-tenant';
        return this.roleService.update(id, tenantId, updateRoleDto);
    }

    /**
     * DELETE /api/roles/:id
     * Delete role (owner only)
     */
    @Delete(':id')
    @Roles('owner')
    delete(@Request() req, @Param('id') id: string) {
        const tenantId = req.user?.tenantId || 'default-tenant';
        return this.roleService.delete(id, tenantId);
    }
}
