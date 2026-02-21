import { Request, Response } from 'express';
import { SubscriptionsService } from './subscriptions.service';

const service = new SubscriptionsService();

export class SubscriptionsController {
  async getCurrent(req: Request, res: Response) {
    const result = await service.getCurrent(req.user!.id);
    res.json({ success: true, data: result });
  }

  async subscribe(req: Request, res: Response) {
    const result = await service.subscribe(req.user!.id, req.body.planId);
    res.json({ success: true, data: result });
  }

  async cancel(req: Request, res: Response) {
    const result = await service.cancel(req.user!.id);
    res.json({ success: true, data: result });
  }

  async changePlan(req: Request, res: Response) {
    const result = await service.changePlan(req.user!.id, req.body.planId);
    res.json({ success: true, data: result });
  }
}
