import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TenantGuard } from './guards';
import { Public } from './decorators';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Public()
    @Post('login')
    async login(@Body() body: { idToken: string }) {
        return this.authService.validateFirebaseToken(body.idToken);
    }

    @Get('me')
    async getMe(@Request() req) {
        const userId = req.user.sub;
        const tenants = await this.authService.getUserTenants(userId);

        return {
            user: req.user,
            tenants: tenants.map((t) => ({
                id: t.tenant.id,
                name: t.tenant.name,
                role: t.role,
                subdomain: t.tenant.subdomain,
            })),
        };
    }

    @Get('tenants/:tenantId/apps')
    @UseGuards(TenantGuard)
    async getAvailableApps(@Request() req) {
        const userId = req.user.sub;
        const tenantId = req.params.tenantId || req.tenantId;

        return this.authService.getAvailableApps(userId, tenantId);
    }
}
