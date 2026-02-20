import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.middleware';

// Role hierarchy: admin ⊃ professional ⊃ user
// A professional inherits all user permissions, an admin inherits all.
const ROLE_HIERARCHY: Record<string, string[]> = {
  admin: ['admin', 'professional', 'user'],
  professional: ['professional', 'user'],
  user: ['user'],
};

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const userRoles = ROLE_HIERARCHY[req.user.role] || [req.user.role];
    const hasPermission = roles.some((r) => userRoles.includes(r));

    if (!hasPermission) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
}