import { Request, Response } from 'express';
import { GuardianesService } from './guardianes.service';

const service = new GuardianesService();

export class GuardianesController {
  async postEvent(req: Request, res: Response) {
    const { id, type, timestamp, playerId, data } = req.body;

    if (!id || !type || !playerId) {
      return res.status(400).json({ error: 'Missing required fields: id, type, playerId' });
    }

    const validTypes = [
      'registration', 'session_start', 'chapter_start',
      'chapter_complete', 'mission_start', 'mission_complete', 'mission_retry',
    ];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Invalid event type. Valid: ${validTypes.join(', ')}` });
    }

    await service.storeEvent({ id, type, timestamp, playerId, data });
    return res.status(201).json({ ok: true });
  }

  async getStats(_req: Request, res: Response) {
    const stats = await service.getStats();
    return res.json(stats);
  }

  async getEvents(req: Request, res: Response) {
    const limit = Math.min(Number(req.query.limit) || 500, 5000);
    const events = await service.getEvents(limit);
    return res.json(events);
  }
}
