import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppDataSource } from '../ormconfig';
import { ObservatoryAdmin } from '../entities/observatory/ObservatoryAdmin';
import { AppError } from './errorHandler.middleware';

export async function observatoryAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (decoded.role !== 'observatory_admin') {
      throw new AppError('Invalid token role', 403);
    }

    const repo = AppDataSource.getRepository(ObservatoryAdmin);
    const admin = await repo.findOne({ where: { id: decoded.id } });

    if (!admin) {
      throw new AppError('Admin not found', 401);
    }

    if (!admin.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    const adminRole = (admin.role as 'superadmin' | 'admin' | 'editor') || 'admin';

    // Superadmin bypasses per-observatory scoping (can edit data across all observatories).
    // Other roles must have the observatory in their observatories[] array.
    const observatory = req.params.observatory;
    if (
      observatory &&
      adminRole !== 'superadmin' &&
      !admin.observatories.includes(observatory)
    ) {
      throw new AppError('No access to this observatory', 403);
    }

    req.user = {
      id: admin.id,
      email: admin.email,
      role: 'observatory_admin',
      adminRole,
      adminObservatories: admin.observatories,
    };

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new AppError('Invalid or expired token', 401));
    } else {
      next(error);
    }
  }
}
