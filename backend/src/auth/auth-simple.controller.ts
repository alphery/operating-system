import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth-simple.service';
import { TenantGuard, PlatformGuard } from './guards';
import { Public } from './decorators';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    /**
     * POST /auth/login
     * Login with AA/AT/AU ID + password
     */
    @Public()
    @Post('login')
    async login(@Body() body: {
        customUid: string; // AA000001, AT000001, AU000001
        password: string;
    }) {
        return this.authService.login(body);
    }

    /**
     * POST /auth/login-google
     * Login with Google ID Token (Firebase)
     */
    @Public()
    @Post('login-google')
    async loginGoogle(@Body() body: { idToken: string }) {
        return this.authService.loginWithGoogle(body.idToken);
    }

    /**
     * POST /auth/get-email
     * Get email by custom UID (for backward compatibility)
     */
    @Public()
    @Post('get-email')
    async getEmail(@Body() body: { customUid: string }) {
        return this.authService.getEmailByCustomUid(body.customUid);
    }

    /**
     * POST /auth/create-tenant
     * Create new tenant (Super Admin only)
     */
    @Post('create-tenant')
    @UseGuards(PlatformGuard) // Only super_admin can access
    async createTenant(@Request() req, @Body() body: {
        name: string;
        email: string;
        password: string;
        displayName?: string;
    }) {
        const createdBy = req.user.customUid; // AA000001
        return this.authService.createTenant(createdBy, body);
    }

    /**
     * POST /auth/create-user
     * Create new user under tenant (Tenant Admin only)
     */
    @Post('create-user')
    async createUser(@Request() req, @Body() body: {
        tenantId: string;
        name: string;
        email: string;
        password: string;
        displayName?: string;
    }) {
        const createdBy = req.user.customUid; // AT000001
        return this.authService.createUser(createdBy, body);
    }

    /**
     * GET /auth/me
     * Get current user info
     */
    @Get('me')
    async getMe(@Request() req) {
        const userId = req.user.sub;

        // Fetch full user to get latest settings/photo
        const user = await this.authService.getUserById(userId);
        const tenants = await this.authService.getUserTenants(userId);

        return {
            user: {
                id: user.id,
                customUid: user.customUid,
                email: user.email,
                displayName: user.displayName,
                photoUrl: user.photoUrl,
                role: user.role,
                settings: user.settings,
                isGod: user.isGod,
            },
            tenants: tenants.map((t) => ({
                id: t.tenant.id,
                name: t.tenant.name,
                role: t.role,
                subdomain: t.tenant.subdomain,
            })),
        };
    }

    /**
     * GET /auth/tenants/:tenantId/apps
     * Get available apps for user in tenant
     */
    @Get('tenants/:tenantId/apps')
    @UseGuards(TenantGuard)
    async getAvailableApps(@Request() req) {
        const userId = req.user.sub;
        const tenantId = req.params.tenantId || req.tenantId;

        return this.authService.getAvailableApps(userId, tenantId);
    }

    /**
     * PATCH /auth/me
     * Update user profile settings
     */
    @Post('me')
    async updateMe(@Request() req, @Body() body: any) {
        const userId = req.user.sub;
        return this.authService.updateUser(userId, body);
    }
}
