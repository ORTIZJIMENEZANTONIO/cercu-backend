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

  // Work Photos
  async getWorkPhotos(req: Request, res: Response) {
    const result = await service.getWorkPhotos(req.user!.id);
    res.json({ success: true, data: result });
  }

  async addWorkPhotos(req: Request, res: Response) {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, error: { message: 'No files uploaded' } });
      return;
    }
    const filenames = files.map(f => f.filename);
    const result = await service.addWorkPhotos(
      req.user!.id,
      parseInt(req.params.categoryId),
      filenames
    );
    res.status(201).json({ success: true, data: result });
  }

  async deleteWorkPhoto(req: Request, res: Response) {
    const result = await service.deleteWorkPhoto(req.user!.id, parseInt(req.params.id));
    res.json({ success: true, ...result });
  }

  // Pending Changes
  async requestProfileChange(req: Request, res: Response) {
    const result = await service.requestProfileChange(
      req.user!.id,
      req.body.fieldName,
      req.body.requestedValue
    );
    res.status(201).json({ success: true, data: result });
  }

  async getPendingChanges(req: Request, res: Response) {
    const result = await service.getPendingChanges(req.user!.id);
    res.json({ success: true, data: result });
  }
}