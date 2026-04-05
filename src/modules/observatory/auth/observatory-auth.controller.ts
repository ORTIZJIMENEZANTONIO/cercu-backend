import { Request, Response } from 'express';
import { ObservatoryAuthService } from './observatory-auth.service';

const service = new ObservatoryAuthService();

export class ObservatoryAuthController {
  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const result = await service.login(email, password);
    res.json({ success: true, data: result });
  }

  async me(req: Request, res: Response) {
    const result = await service.me(req.user!.id);
    res.json({ success: true, data: result });
  }
}
