import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler.middleware';
import { globalRateLimiter } from './middleware/rateLimiter.middleware';

import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import categoryRoutes from './modules/categories/categories.routes';
import professionalRoutes from './modules/professionals/professionals.routes';
import leadRoutes from './modules/leads/leads.routes';
import walletRoutes from './modules/wallet/wallet.routes';
import adminRoutes from './modules/admin/admin.routes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.cors.origin, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('dev'));
  app.use(globalRateLimiter);

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/categories', categoryRoutes);
  app.use('/api/v1/professionals', professionalRoutes);
  app.use('/api/v1/leads', leadRoutes);
  app.use('/api/v1/wallet', walletRoutes);
  app.use('/api/v1/admin', adminRoutes);

  app.use(errorHandler);

  return app;
}