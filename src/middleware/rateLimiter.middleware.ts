import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

const isDev = process.env.NODE_ENV === 'development';

// No-op middleware for dev
const passthrough = (_req: Request, _res: Response, next: NextFunction) => next();

export const globalRateLimiter = isDev
  ? passthrough
  : rateLimit({
      windowMs: 60 * 1000,
      max: 100,
      message: {
        success: false,
        error: { message: 'Too many requests, please try again later' },
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

export const authRateLimiter = isDev
  ? passthrough
  : rateLimit({
      windowMs: 60 * 1000,
      max: 10,
      message: {
        success: false,
        error: { message: 'Too many auth attempts, please try again later' },
      },
    });

export const leadsRateLimiter = isDev
  ? passthrough
  : rateLimit({
      windowMs: 60 * 60 * 1000,
      max: 20,
      message: {
        success: false,
        error: { message: 'Too many lead requests, please try again later' },
      },
    });
