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
import planRoutes from './modules/plans/plans.routes';
import subscriptionRoutes from './modules/subscriptions/subscriptions.routes';
import boostRoutes from './modules/boosts/boosts.routes';
import gamificationRoutes from './modules/gamification/gamification.routes';
import guardianesRoutes from './modules/guardianes/guardianes.routes';
import observatoryAuthRoutes from './modules/observatory/auth/observatory-auth.routes';
import observatoryAdminRoutes from './modules/observatory/admin/observatory-admin.routes';
import observatoryDetectorRoutes from './modules/observatory/detector/detector.routes';
import observatoryAIRoutes from './modules/observatory/ai/ai.routes';
import observatoryRemoteSensingRoutes from './modules/observatory/remote-sensing/remote-sensing.routes';
import arrecifesRoutes from './modules/observatory/arrecifes/arrecifes.routes';
import humedalesAttributionRoutes from './modules/observatory/humedales/humedales-attribution.routes';
import techosVerdesAttributionRoutes from './modules/observatory/techos-verdes/techos-verdes-attribution.routes';
import observatoryEventsRoutes from './modules/observatory/events/events.routes';

export function createApp() {
  const app = express();

  // Confiamos en el primer hop (nginx) para X-Forwarded-For / X-Forwarded-Proto.
  // Sin esto, express-rate-limit lanza ValidationError porque ve la IP interna
  // 127.0.0.1 en cada request, y los logs se llenan de avisos. Valor `1` =
  // confiar en un solo proxy (que es nuestro caso: nginx local en el VPS).
  app.set('trust proxy', 1);

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
  app.use('/api/v1/plans', planRoutes);
  app.use('/api/v1/subscriptions', subscriptionRoutes);
  app.use('/api/v1/boosts', boostRoutes);
  app.use('/api/v1/gamification', gamificationRoutes);
  app.use('/api/guardianes', guardianesRoutes);
  app.use('/api/v1/observatory/auth', observatoryAuthRoutes);
  // Las rutas de arrecifes usan paths LITERALES (`/arrecifes/...`) y deben
  // montarse ANTES del catch-all genérico `/:observatory/...` de
  // observatoryAdminRoutes. Si no, p.ej. GET /arrecifes/admin/summary cae
  // al handler genérico (humedales-style, `contenido: {}` + `prospectos`)
  // y no al arrecifes-específico (rico, con `content`/`totals`/`observations`).
  app.use('/api/v1/observatory', arrecifesRoutes);
  // Rutas humedales-only para tiers/contributors/atribucion. Tambien usan
  // path con `:observatory` pero hacen un assertHumedales() interno y
  // tienen rutas mas especificas (/contributors, /tiers, /prospectos/:id/contributor)
  // que no colisionan con el catch-all de observatoryAdminRoutes.
  app.use('/api/v1/observatory', humedalesAttributionRoutes);
  // Mismo patron para techos-verdes: rutas especificas con assertTechosVerdes()
  // interno, montadas antes del catch-all generico de observatoryAdminRoutes.
  app.use('/api/v1/observatory', techosVerdesAttributionRoutes);
  app.use('/api/v1/observatory', observatoryAdminRoutes);
  app.use('/api/v1/observatory', observatoryDetectorRoutes);
  app.use('/api/v1/observatory', observatoryAIRoutes);
  app.use('/api/v1/observatory', observatoryRemoteSensingRoutes);
  app.use('/api/v1', observatoryEventsRoutes);

  app.use(errorHandler);

  return app;
}