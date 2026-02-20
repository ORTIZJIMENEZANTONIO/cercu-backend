import { Request, Response } from 'express';
import { WalletService } from './wallet.service';

const service = new WalletService();

export class WalletController {
  async getBalance(req: Request, res: Response) {
    const result = await service.getBalance(req.user!.id);
    res.json({ success: true, data: result });
  }

  async getTransactions(req: Request, res: Response) {
    const result = await service.getTransactions(req.user!.id, req.query);
    res.json({ success: true, ...result });
  }

  async topup(req: Request, res: Response) {
    const result = await service.topup(req.user!.id, req.body.amount);
    res.json({ success: true, data: result });
  }
}