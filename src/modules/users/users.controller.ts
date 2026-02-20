import { Request, Response } from 'express';
import { UsersService } from './users.service';

const service = new UsersService();

export class UsersController {
  async getProfile(req: Request, res: Response) {
    const result = await service.getProfile(req.user!.id);
    res.json({ success: true, data: result });
  }

  async updateProfile(req: Request, res: Response) {
    const result = await service.updateProfile(req.user!.id, req.body);
    res.json({ success: true, data: result });
  }

  async uploadProfilePicture(req: Request, res: Response) {
    if (!req.file) {
      res.status(400).json({ success: false, error: { message: 'No file uploaded' } });
      return;
    }
    const result = await service.updateProfilePicture(req.user!.id, req.file.filename);
    res.json({ success: true, data: result });
  }

  async upgradeRole(req: Request, res: Response) {
    const result = await service.upgradeToProRole(req.user!.id);
    res.json({ success: true, data: result });
  }
}