import { Request, Response } from 'express';
import { GamificationService } from './gamification.service';

const service = new GamificationService();

export class GamificationController {
  async getDashboard(req: Request, res: Response) {
    const result = await service.getDashboard(req.user!.id);
    res.json({ success: true, data: result });
  }

  async getAchievements(req: Request, res: Response) {
    const result = await service.getAchievements(req.user!.id);
    res.json({ success: true, data: result });
  }

  async getMissions(req: Request, res: Response) {
    const result = await service.getMissions(req.user!.id);
    res.json({ success: true, data: result });
  }

  async getXPHistory(req: Request, res: Response) {
    const result = await service.getXPHistory(req.user!.id, req.query);
    res.json({ success: true, ...result });
  }

  async getTrustScore(req: Request, res: Response) {
    const result = await service.getTrustScore(req.user!.id);
    res.json({ success: true, data: result });
  }
}
