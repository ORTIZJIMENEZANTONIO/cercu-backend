import { Request, Response } from 'express';
import { RemoteSensingService } from './remote-sensing.service';

const service = new RemoteSensingService();

export class RemoteSensingController {
  async getIndices(req: Request, res: Response) {
    const { lat, lng, alcaldia, radio, fechaInicio, fechaFin } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ error: { message: 'Se requieren lat y lng' } });
    }

    const result = await service.getIndices({ lat, lng, alcaldia, radio, fechaInicio, fechaFin });
    res.json(result);
  }
}
