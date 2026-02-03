import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('audit')
@UseGuards(RolesGuard)
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    /**
     * GET /api/audit
     * Get audit logs (admin/owner only)
     */
    @Get()
    @Roles('owner', 'admin')
    findAll(
        @Request() req,
        @Query('entity') entity?: string,
        @Query('userId') userId?: string,
        @Query('action') action?: string,
        @Query('limit') limit?: string,
    ) {
        const tenantId = req.user?.tenantId || 'default-tenant';

        return this.auditService.findAll(tenantId, {
            entity,
            userId,
            action,
            limit: limit ? parseInt(limit) : 100,
        });
    }

    /**
     * GET /api/audit/:entity/:entityId
     * Get audit trail for specific record
     */
    @Get(':entity/:entityId')
    @Roles('owner', 'admin', 'member')
    findByEntity(
        @Request() req,
        @Query('entity') entity: string,
        @Query('entityId') entityId: string,
    ) {
        const tenantId = req.user?.tenantId || 'default-tenant';
        return this.auditService.findByEntity(tenantId, entity, entityId);
    }
}
