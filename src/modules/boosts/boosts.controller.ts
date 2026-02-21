import { Request, Response } from 'express';
import { BoostsService } from './boosts.service';

const service = new BoostsService();

export class BoostsController {
  async listTypes(_req: Request, res: Response) {
    const result = await service.listTypes();
    res.json({ success: true, data: result });
  }

  async getActive(req: Request, res: Response) {
    const result = await service.getActive(req.user!.id);
    res.json({ success: true, data: result });
  }

  async purchase(req: Request, res: Response) {
    const result = await service.purchase(req.user!.id, req.body.boostTypeId, req.body.categoryId);
    res.json({ success: true, data: result });
  }

  async getPromoted(req: Request, res: Response) {
    const categoryId = parseInt(req.params.categoryId);
    const result = await service.getPromotedForCategory(categoryId);
    res.json({ success: true, data: result });
  }
}
