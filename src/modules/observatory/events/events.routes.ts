import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { EventsController } from './events.controller';
import { observatoryAuthMiddleware } from '../../../middleware/observatory-auth.middleware';

const router = Router();
const controller = new EventsController();
const isDev = process.env.NODE_ENV === 'development';

// Limita ingestión de eventos a 60 lotes/min/IP en producción.
// Cada lote acepta hasta 50 eventos, así que ~3000 eventos por minuto por IP.
const ingestRateLimiter = isDev
  ? (_req: any, _res: any, next: any) => next()
  : rateLimit({
      windowMs: 60 * 1000,
      max: 60,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: { message: 'Demasiados eventos enviados, intenta más tarde' },
      },
    });

// ── Pública: ingestión desde el frontend (anónima) ──
router.post('/observatory/:observatory/events', ingestRateLimiter, (req, res, next) =>
  controller.ingest(req, res).catch(next),
);

// ── Admin: dashboards de monitoreo ──
router.get(
  '/observatory/:observatory/admin/analytics/summary',
  observatoryAuthMiddleware,
  (req, res, next) => controller.summary(req, res).catch(next),
);

export default router;
