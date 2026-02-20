import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppDataSource } from '../ormconfig';
import { User } from '../entities/User';
import { AppError } from './errorHandler.middleware';

export async function authMiddleware(
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

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: decoded.id } });

    if (!user) {
      throw new AppError('User not found', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    req.user = {
      id: user.id,
      phone: user.phone,
      role: user.role,
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