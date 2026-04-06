import { Request, Response } from 'express';
import { AIService } from './ai.service';

const service = new AIService();

export class AIController {
  async analyzeRoof(req: Request, res: Response) {
    const result = await service.analyzeRoof(req.body);
    res.json(result);
  }
}
