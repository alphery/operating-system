import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private jwtService: JwtService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractToken(request);

        if (!token) {
            throw new UnauthorizedException();
        }

        try {
            const payload = this.jwtService.verify(token, {
                secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production'
            });
            request.user = payload;
        } catch {
            throw new UnauthorizedException();
        }
        return true;
    }

    private extractToken(request: any): string | undefined {
        // Check header
        if (request.headers.authorization) {
            const [type, token] = request.headers.authorization.split(' ');
            if (type === 'Bearer') return token;
        }
        return undefined;
    }
}
