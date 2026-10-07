import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../errors';

export type AppRole = 'PLATFORM_ADMIN' | 'PHARMACY_OWNER' | 'PHARMACIST' | 'CUSTOMER';

export const requireRoles = (...roles: (AppRole | string)[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Access denied. Requires one of roles: ${roles.join(', ')}`));
    }

    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    if (req.user.role === 'PHARMACY_OWNER') {
      return next(); // Pharmacy Owner has full organization-level access
    }

    if (!req.user.permissions.includes(permission)) {
      return next(new ForbiddenError(`Missing required permission: ${permission}`));
    }

    next();
  };
};
