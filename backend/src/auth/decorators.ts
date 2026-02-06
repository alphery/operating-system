import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to specify which app is required for a route
 * Usage: @RequireApp('crm-pro')
 */
export const RequireApp = (appId: string) => SetMetadata('app', appId);

/**
 * Decorator to specify minimum role required for a route
 * Usage: @RequireRole('admin')
 */
export const RequireRole = (role: string) => SetMetadata('role', role);

/**
 * Decorator to mark a route as public (no auth required)
 */
export const Public = () => SetMetadata('isPublic', true);
