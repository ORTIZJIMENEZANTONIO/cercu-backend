import { Request, Response } from 'express';
import { LeadsService } from './leads.service';

const service = new LeadsService();

export class LeadsController {
  async create(req: Request, res: Response) {
    const result = await service.create(req.user!.id, req.body);
    res.status(201).json({ success: true, data: result });
  }

  async getMyLeads(req: Request, res: Response) {
    const result = await service.getUserLeads(req.user!.id, req.query);
    res.json({ success: true, ...result });
  }

  async getById(req: Request, res: Response) {
    const result = await service.getById(parseInt(req.params.id), req.user!.id);
    res.json({ success: true, data: result });
  }

  async updateStatus(req: Request, res: Response) {
    const result = await service.updateStatus(
      parseInt(req.params.id),
      req.user!.id,
      req.body.status
    );
    res.json({ success: true, data: result });
  }

  async cancel(req: Request, res: Response) {
    const result = await service.cancel(parseInt(req.params.id), req.user!.id);
    res.json({ success: true, data: result });
  }
}