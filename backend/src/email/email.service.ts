import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmailService {
    constructor(private prisma: PrismaService) { }

    /**
     * Queue an email to be sent
     */
    async queueEmail(params: {
        to: string;
        subject: string;
        body: string;
        from?: string;
        template?: string;
        data?: any;
        tenantId?: string;
    }) {
        return this.prisma.emailQueue.create({
            data: {
                to: params.to,
                from: params.from || process.env.SMTP_FROM || 'noreply@alphery.com',
                subject: params.subject,
                body: params.body,
                template: params.template,
                data: params.data || null,
                tenantId: params.tenantId,
                status: 'pending',
            },
        });
    }

    /**
     * Send invitation email
     */
    async sendInvitation(params: {
        to: string;
        inviterName: string;
        workspaceName: string;
        invitationLink: string;
        tenantId: string;
    }) {
        const emailBody = this.renderInvitationTemplate(params);

        return this.queueEmail({
            to: params.to,
            subject: `${params.inviterName} invited you to join ${params.workspaceName}`,
            body: emailBody,
            template: 'invitation',
            data: params,
            tenantId: params.tenantId,
        });
    }

    /**
     * Send notification email
     */
    async sendNotificationEmail(params: {
        to: string;
        title: string;
        message: string;
        link?: string;
        tenantId: string;
    }) {
        const emailBody = this.renderNotificationTemplate(params);

        return this.queueEmail({
            to: params.to,
            subject: params.title,
            body: emailBody,
            template: 'notification',
            data: params,
            tenantId: params.tenantId,
        });
    }

    /**
     * Get pending emails
     */
    async getPendingEmails(limit = 50) {
        return this.prisma.emailQueue.findMany({
            where: {
                status: 'pending',
                attempts: { lt: 3 }, // Max 3 attempts
            },
            orderBy: { createdAt: 'asc' },
            take: limit,
        });
    }

    /**
     * Mark email as sent
     */
    async markAsSent(id: string) {
        return this.prisma.emailQueue.update({
            where: { id },
            data: {
                status: 'sent',
                sentAt: new Date(),
            },
        });
    }

    /**
     * Mark email as failed
     */
    async markAsFailed(id: string, error: string) {
        return this.prisma.emailQueue.update({
            where: { id },
            data: {
                status: 'failed',
                error,
                attempts: { increment: 1 },
            },
        });
    }

    /**
     * Render invitation email template
     */
    private renderInvitationTemplate(params: {
        inviterName: string;
        workspaceName: string;
        invitationLink: string;
    }): string {
        return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 You're Invited!</h1>
    </div>
    <div class="content">
      <p>Hi there,</p>
      <p><strong>${params.inviterName}</strong> has invited you to join <strong>${params.workspaceName}</strong> on Alphery OS.</p>
      <p>Alphery OS is a modern, collaborative workspace for managing your business operations.</p>
      <p style="text-align: center;">
        <a href="${params.invitationLink}" class="button">Accept Invitation</a>
      </p>
      <p style="color: #666; font-size: 14px;">This invitation will expire in 7 days.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Alphery OS. All rights reserved.</p>
      <p>If you didn't expect this invitation, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
    }

    /**
     * Render notification email template
     */
    private renderNotificationTemplate(params: {
        title: string;
        message: string;
        link?: string;
    }): string {
        return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>${params.title}</h2>
    </div>
    <div class="content">
      <p>${params.message}</p>
      ${params.link ? `
      <p style="text-align: center;">
        <a href="${params.link}" class="button">View Details</a>
      </p>
      ` : ''}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Alphery OS. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
    }
}
