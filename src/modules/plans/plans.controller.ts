import { Request, Response } from 'express';
import { PlansService } from './plans.service';

const service = new PlansService();

export class PlansController {
  async listPlans(_req: Request, res: Response) {
    const result = await service.listPlans();
    res.json({ success: true, data: result });
  }

  async getPlan(req: Request, res: Response) {
    const result = await service.getPlan(parseInt(req.params.id));
    res.json({ success: true, data: result });
  }
}
