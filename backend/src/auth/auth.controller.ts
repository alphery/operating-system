import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TenantGuard } from './guards';
import { Public } from './decorators';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    /**
     * POST /auth/signup
     * Register new user with custom UID
     */
    @Public()
    @Post('signup')
    async signup(@Body() body: {
        name: string;
        email: string;
        mobile?: string;
        password: string;
    }) {
        return this.authService.signUp(body);
    }

    /**
     * POST /auth/login
     * Login with custom UID + password
     */
    @Public()
    @Post('login')
    async login(@Body() body: {
        customUid?: string;
        idToken?: string; // For legacy Firebase auth
        password?: string;
    }) {
        // New custom UID login
        if (body.customUid && body.password) {
            return this.authService.login({
                customUid: body.customUid,
                password: body.password,
            });
        }

        // Legacy Firebase token login
        if (body.idToken) {
            return this.authService.validateFirebaseToken(body.idToken);
        }

        throw new Error('Invalid login credentials');
    }

    /**
     * POST /auth/get-email
     * Get email by custom UID (for frontend Firebase auth)
     */
    @Public()
    @Post('get-email')
    async getEmail(@Body() body: { customUid: string }) {
        return this.authService.getEmailByCustomUid(body.customUid);
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
    @Post('me') // Or use Patch, but sometimes Post is safer for JSON patches in simple setups
    async updateMe(@Request() req, @Body() body: any) {
        const userId = req.user.sub;
        return this.authService.updateUser(userId, body);
    }

    /**
     * GET /auth/search?q=...
     * Search users by customUid or displayName
     */
    @Get('search')
    async searchUsers(@Request() req) {
        const query = req.query.q || '';
        const userId = req.user.sub;
        return this.authService.searchUsers(query, userId);
    }
}
