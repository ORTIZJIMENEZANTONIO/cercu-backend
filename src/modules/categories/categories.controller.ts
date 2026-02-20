import { Request, Response } from 'express';
import { CategoriesService } from './categories.service';

const service = new CategoriesService();

export class CategoriesController {
  async getAll(_req: Request, res: Response) {
    const categories = await service.getAll();
    res.json({ success: true, data: categories });
  }

  async getById(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      const category = await service.getBySlug(req.params.id);
      res.json({ success: true, data: category });
    } else {
      const category = await service.getById(id);
      res.json({ success: true, data: category });
    }
  }
}