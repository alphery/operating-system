import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    constructor(private jwtService: JwtService) { }

    async use(req: Request, res: Response, next: NextFunction) {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                // No token provided, continue without user (some endpoints are public)
                return next();
            }

            const token = authHeader.substring(7);
            const payload = this.jwtService.verify(token);

            // Attach user to request object
            req['user'] = {
                userId: payload.userId,
                email: payload.email,
                tenantId: payload.tenantId,
                role: payload.role,
            };

            next();
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }
}
