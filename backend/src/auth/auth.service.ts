import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
    private googleClient: OAuth2Client;

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) {
        this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    }

    /**
     * Verify Google ID token and login/register user
     */
    async googleLogin(idToken: string) {
        try {
            // Verify token with Google
            const ticket = await this.googleClient.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            if (!payload) {
                throw new UnauthorizedException('Invalid Google token');
            }

            const { sub: googleId, email, name, given_name, family_name } = payload;

            if (!email) {
                throw new UnauthorizedException('Email not provided by Google');
            }

            // Check if user exists
            let user = await this.prisma.user.findUnique(({
                where: { googleId },
                include: { tenant: true },
            }) as any);

            // If user doesn't exist, create new tenant + user
            if (!user) {
                const result = await this.createNewUserWithTenant({
                    googleId,
                    email,
                    name: name || email.split('@')[0],
                    firstName: given_name,
                    lastName: family_name,
                });
                user = result.user;
            }

            // Generate JWT with tenantId embedded
            const accessToken = this.jwtService.sign({
                userId: user.id,
                email: user.email,
                tenantId: user.tenantId,
                role: user.teamRole,
            });

            return {
                accessToken,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.teamRole,
                },
                tenant: {
                    id: (user as any).tenant.id,
                    name: (user as any).tenant.name,
                    plan: (user as any).tenant.plan,
                },
            };
        } catch (error) {
            console.error('Google login error:', error);
            throw new UnauthorizedException('Google authentication failed');
        }
    }

    /**
     * Create new tenant and owner user
     */
    private async createNewUserWithTenant(userData: {
        googleId: string;
        email: string;
        name: string;
        firstName?: string;
        lastName?: string;
    }) {
        return this.prisma.$transaction(async (tx) => {
            // Create subdomain from email
            const subdomain = userData.email
                .split('@')[0]
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '-');

            // Create tenant (workspace)
            const tenant = await tx.tenant.create({
                data: {
                    name: `${userData.name}'s Workspace`,
                    subdomain: `${subdomain}-${Date.now()}`, // Ensure uniqueness
                    plan: 'free',
                },
            });

            // Create user as owner
            const user = await tx.user.create({
                data: {
                    googleId: userData.googleId,
                    email: userData.email,
                    name: userData.name,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    tenantId: tenant.id,
                    teamRole: 'owner', // First user is always owner
                    role: 'ADMIN', // System role
                },
                include: { tenant: true },
            });

            // Update tenant with ownerId
            await tx.tenant.update({
                where: { id: tenant.id },
                data: { ownerId: user.id },
            });

            return { tenant, user };
        });
    }

    /**
     * Accept invitation and join existing tenant
     */
    async acceptInvitation(token: string, googleId: string, userData: any) {
        const invitation = await this.prisma.invitation.findUnique({
            where: { token },
            include: { tenant: true },
        });

        if (!invitation || invitation.status !== 'pending') {
            throw new UnauthorizedException('Invalid or expired invitation');
        }

        if (new Date() > invitation.expiresAt) {
            await this.prisma.invitation.update({
                where: { id: invitation.id },
                data: { status: 'expired' },
            });
            throw new UnauthorizedException('Invitation has expired');
        }

        // Create user in existing tenant
        const user = await this.prisma.user.create({
            data: {
                googleId,
                email: invitation.email,
                name: userData.name,
                firstName: userData.firstName,
                lastName: userData.lastName,
                tenantId: invitation.tenantId,
                teamRole: invitation.role,
                role: invitation.role === 'admin' ? 'ADMIN' : 'USER',
            },
            include: { tenant: true },
        });

        // Mark invitation as accepted
        await this.prisma.invitation.update({
            where: { id: invitation.id },
            data: { status: 'accepted' },
        });

        // Generate JWT
        const accessToken = this.jwtService.sign({
            userId: user.id,
            email: user.email,
            tenantId: user.tenantId,
            role: user.teamRole,
        });

        return {
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.teamRole,
            },
            tenant: {
                id: user.tenant.id,
                name: user.tenant.name,
                plan: user.tenant.plan,
            },
        };
    }

    /**
     * Verify JWT and extract user info
     */
    async validateToken(token: string) {
        try {
            const payload = this.jwtService.verify(token);
            return payload;
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }
}
