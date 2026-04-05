import { Request, Response } from 'express';
import { DetectorService } from './detector.service';

const service = new DetectorService();

export class DetectorController {
  async runDetection(req: Request, res: Response) {
    const { observatory } = req.params;
    const { bbox, minAreaM2, maxAreaM2, minScore } = req.body;
    const results = await service.runDetection(observatory, { bbox, minAreaM2, maxAreaM2, minScore });
    res.json({ success: true, data: results, total: results.length });
  }

  async submitAsProspects(req: Request, res: Response) {
    const { observatory } = req.params;
    const { candidates } = req.body;
    const result = await service.submitDetectedAsProspects(observatory, candidates, req.user!.id);
    res.status(201).json({ success: true, data: result });
  }
}
