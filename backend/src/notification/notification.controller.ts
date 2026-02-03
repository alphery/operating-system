import { Controller, Get, Post, Delete, Param, Request, Body } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    /**
     * GET /api/notifications
     * Get all notifications for current user
     */
    @Get()
    findAll(@Request() req) {
        const tenantId = req.user?.tenantId || 'default-tenant';
        const userId = req.user?.userId;

        return this.notificationService.findAll(tenantId, userId);
    }

    /**
     * GET /api/notifications/unread
     * Get unread notifications
     */
    @Get('unread')
    findUnread(@Request() req) {
        const tenantId = req.user?.tenantId || 'default-tenant';
        const userId = req.user?.userId;

        return this.notificationService.findUnread(tenantId, userId);
    }

    /**
     * POST /api/notifications/:id/read
     * Mark notification as read
     */
    @Post(':id/read')
    markAsRead(@Param('id') id: string, @Request() req) {
        const userId = req.user?.userId;
        return this.notificationService.markAsRead(id, userId);
    }

    /**
     * POST /api/notifications/read-all
     * Mark all notifications as read
     */
    @Post('read-all')
    markAllAsRead(@Request() req) {
        const tenantId = req.user?.tenantId || 'default-tenant';
        const userId = req.user?.userId;

        return this.notificationService.markAllAsRead(tenantId, userId);
    }

    /**
     * DELETE /api/notifications/:id
     * Delete notification
     */
    @Delete(':id')
    delete(@Param('id') id: string, @Request() req) {
        const userId = req.user?.userId;
        return this.notificationService.delete(id, userId);
    }

    /**
     * POST /api/notifications/broadcast
     * Send notification to all team members (admin only)
     */
    @Post('broadcast')
    broadcast(@Request() req, @Body() body: { type: string; title: string; message: string; link?: string }) {
        const tenantId = req.user?.tenantId || 'default-tenant';

        return this.notificationService.broadcast({
            tenantId,
            ...body,
        });
    }
}
