import { Controller, Post, Body, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    /**
     * POST /api/auth/google
     * Login or register with Google
     * 
     * Frontend sends Google ID token after user signs in
     */
    @Post('google')
    async googleLogin(@Body() body: { idToken: string; invitationToken?: string }) {
        if (body.invitationToken) {
            // User is accepting an invitation
            // First verify Google token to get user data
            const ticket = await this.authService['googleClient'].verifyIdToken({
                idToken: body.idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();

            return this.authService.acceptInvitation(
                body.invitationToken,
                payload.sub,
                {
                    name: payload.name,
                    firstName: payload.given_name,
                    lastName: payload.family_name,
                }
            );
        }

        // Normal login/signup
        return this.authService.googleLogin(body.idToken);
    }

    /**
     * GET /api/auth/me
     * Get current user info from JWT
     */
    @Get('me')
    async getCurrentUser(@Headers('authorization') authorization: string) {
        if (!authorization || !authorization.startsWith('Bearer ')) {
            throw new UnauthorizedException('No token provided');
        }

        const token = authorization.substring(7);
        return this.authService.validateToken(token);
    }
}
