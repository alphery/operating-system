import { Controller, Get, Post, Delete, Body, Param, Request } from '@nestjs/common';
import { InvitationService } from './invitation.service';

@Controller('invitations')
export class InvitationController {
    constructor(private readonly invitationService: InvitationService) { }

    /**
     * POST /api/invitations
     * Invite user to join workspace
     * 
     * Body: { email: "user@example.com", role: "member" }
     */
    @Post()
    create(@Request() req, @Body() createInvitationDto: { email: string; role?: string }) {
        // Extract tenantId from JWT (you'll add middleware for this)
        const tenantId = req.user?.tenantId || 'default-tenant';
        const invitedById = req.user?.userId || 'system';

        return this.invitationService.create(tenantId, invitedById, createInvitationDto);
    }

    /**
     * GET /api/invitations
     * List all pending invitations for tenant
     */
    @Get()
    findAll(@Request() req) {
        const tenantId = req.user?.tenantId || 'default-tenant';
        return this.invitationService.findAll(tenantId);
    }

    /**
     * GET /api/invitations/token/:token
     * Get invitation details by token (for accept page)
     */
    @Get('token/:token')
    findByToken(@Param('token') token: string) {
        return this.invitationService.findByToken(token);
    }

    /**
     * DELETE /api/invitations/:id
     * Cancel invitation
     */
    @Delete(':id')
    cancel(@Request() req, @Param('id') id: string) {
        const tenantId = req.user?.tenantId || 'default-tenant';
        return this.invitationService.cancel(id, tenantId);
    }

    /**
     * POST /api/invitations/:id/resend
     * Resend invitation email
     */
    @Post(':id/resend')
    resend(@Request() req, @Param('id') id: string) {
        const tenantId = req.user?.tenantId || 'default-tenant';
        return this.invitationService.resend(id, tenantId);
    }
}
