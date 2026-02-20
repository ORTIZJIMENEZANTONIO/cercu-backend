import { Request, Response } from 'express';
import { ProfessionalsService } from './professionals.service';

const service = new ProfessionalsService();

export class ProfessionalsController {
  async onboard(req: Request, res: Response) {
    const result = await service.onboard(req.user!.id, req.body);
    res.status(201).json({ success: true, data: result });
  }

  async getProfile(req: Request, res: Response) {
    const result = await service.getProfile(req.user!.id);
    res.json({ success: true, data: result });
  }

  async updateProfile(req: Request, res: Response) {
    const result = await service.updateProfile(req.user!.id, req.body);
    res.json({ success: true, data: result });
  }

  async updateCategories(req: Request, res: Response) {
    const result = await service.updateCategories(req.user!.id, req.body.categoryIds);
    res.json({ success: true, data: result });
  }

  async updateSchedule(req: Request, res: Response) {
    const result = await service.updateSchedule(req.user!.id, req.body.schedule);
    res.json({ success: true, data: result });
  }

  async toggleAvailability(req: Request, res: Response) {
    const result = await service.toggleAvailability(req.user!.id, req.body.isAvailable);
    res.json({ success: true, data: result });
  }

  async getLeads(req: Request, res: Response) {
    const result = await service.getMatchedLeads(req.user!.id);
    res.json({ success: true, data: result });
  }

  async getLeadPreview(req: Request, res: Response) {
    const result = await service.getLeadPreview(req.user!.id, parseInt(req.params.id));
    res.json({ success: true, data: result });
  }

  async takeLead(req: Request, res: Response) {
    const result = await service.takeLead(req.user!.id, parseInt(req.params.id));
    res.json({ success: true, data: result });
  }

  async declineLead(req: Request, res: Response) {
    const result = await service.declineLead(req.user!.id, parseInt(req.params.id));
    res.json({ success: true, data: result });
  }

  async getPublicProfile(req: Request, res: Response) {
    const result = await service.getPublicProfile(parseInt(req.params.id));
    res.json({ success: true, data: result });
  }
}