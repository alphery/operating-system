import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { ClientsService } from './clients.service';

@Controller('clients')
export class ClientsController {
    constructor(private readonly clientsService: ClientsService) { }

    @Post()
    create(@Request() req, @Body() createClientDto: any) {
        // For now, use a default tenant if not authenticated
        const tenantId = req.user?.tenantId || 'default-tenant';
        return this.clientsService.create(tenantId, createClientDto);
    }

    @Get()
    findAll(@Request() req) {
        const tenantId = req.user?.tenantId || 'default-tenant';
        return this.clientsService.findAll(tenantId);
    }

    @Get(':id')
    findOne(@Request() req, @Param('id') id: string) {
        const tenantId = req.user?.tenantId || 'default-tenant';
        return this.clientsService.findOne(tenantId, id);
    }

    @Patch(':id')
    update(@Request() req, @Param('id') id: string, @Body() updateClientDto: any) {
        const tenantId = req.user?.tenantId || 'default-tenant';
        return this.clientsService.update(tenantId, id, updateClientDto);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        const tenantId = req.user?.tenantId || 'default-tenant';
        return this.clientsService.remove(tenantId, id);
    }
}
