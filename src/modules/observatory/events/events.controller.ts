import { Request, Response } from 'express';
import { EventsService } from './events.service';

const service = new EventsService();

export class EventsController {
  async ingest(req: Request, res: Response) {
    const observatory = req.params.observatory;
    const events = Array.isArray(req.body) ? req.body : req.body?.events;
    const result = await service.ingest(events, {
      observatory,
      ip: (req.headers['x-forwarded-for'] as string) || req.ip,
      userAgent: req.headers['user-agent'],
      userId: req.user?.id || null,
    });
    res.status(202).json({ success: true, data: result });
  }

  async summary(req: Request, res: Response) {
    const observatory = req.params.observatory;
    const days = Math.min(180, Math.max(1, parseInt(String(req.query.days || '30'), 10) || 30));
    const result = await service.getSummary(observatory, days);
    res.json({ success: true, data: result });
  }
}
