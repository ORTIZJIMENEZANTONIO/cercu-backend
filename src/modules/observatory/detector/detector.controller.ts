import { Request, Response } from 'express';
import { DetectorService } from './detector.service';
import { AppError } from '../../../middleware/errorHandler.middleware';

const service = new DetectorService();

export class DetectorController {
  async runDetection(req: Request, res: Response) {
    const { observatory } = req.params;
    const { bbox, minAreaM2, maxAreaM2, minScore } = req.body;

    if (!bbox || typeof bbox.south !== 'number' || typeof bbox.north !== 'number' || typeof bbox.west !== 'number' || typeof bbox.east !== 'number') {
      throw new AppError('Se requiere un bounding box valido con south, north, west, east', 400);
    }

    try {
      const results = await service.runDetection(observatory, { bbox, minAreaM2, maxAreaM2, minScore });
      res.json({ success: true, data: results, total: results.length });
    } catch (err: any) {
      const msg = err?.message || 'Error desconocido';
      if (msg.includes('Overpass') || msg.includes('fetch') || msg.includes('timeout') || msg.includes('ECONNREFUSED')) {
        throw new AppError(`Error al consultar Overpass API: ${msg}. Intente de nuevo en unos minutos.`, 502);
      }
      throw new AppError(`Error en deteccion: ${msg}`, 500);
    }
  }

  async submitAsProspects(req: Request, res: Response) {
    const { observatory } = req.params;
    const { candidates } = req.body;
    if (!candidates?.length) {
      throw new AppError('Se requiere al menos un candidato', 400);
    }
    const result = await service.submitDetectedAsProspects(observatory, candidates, req.user!.id);
    res.status(201).json({ success: true, data: result });
  }
}
