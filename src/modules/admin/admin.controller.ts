import { Request, Response } from 'express';
import { AdminService } from './admin.service';

const service = new AdminService();

export class AdminController {
  async listUsers(req: Request, res: Response) {
    const result = await service.listUsers(req.query);
    res.json({ success: true, ...result });
  }

  async blockUser(req: Request, res: Response) {
    const result = await service.blockUser(req.user!.id, req.params.id, req.body.reason);
    res.json({ success: true, data: result });
  }

  async unblockUser(req: Request, res: Response) {
    const result = await service.unblockUser(req.user!.id, req.params.id);
    res.json({ success: true, data: result });
  }

  async updateUser(req: Request, res: Response) {
    const result = await service.updateUser(req.user!.id, req.params.id, req.body);
    res.json({ success: true, data: result });
  }

  async flagUser(req: Request, res: Response) {
    const result = await service.flagUser(req.user!.id, req.params.id, req.body.reason);
    res.json({ success: true, data: result });
  }

  async listProfessionals(req: Request, res: Response) {
    const result = await service.listProfessionals(req.query);
    res.json({ success: true, ...result });
  }

  async approveProfessional(req: Request, res: Response) {
    const result = await service.approveProfessional(req.user!.id, req.params.id);
    res.json({ success: true, data: result });
  }

  async rejectProfessional(req: Request, res: Response) {
    const result = await service.rejectProfessional(req.user!.id, req.params.id, req.body.reason);
    res.json({ success: true, data: result });
  }

  async suspendProfessional(req: Request, res: Response) {
    const result = await service.suspendProfessional(req.user!.id, req.params.id, req.body.reason);
    res.json({ success: true, data: result });
  }

  async listLeads(req: Request, res: Response) {
    const result = await service.listLeads(req.query);
    res.json({ success: true, ...result });
  }

  async cancelLead(req: Request, res: Response) {
    const result = await service.cancelLead(req.user!.id, parseInt(req.params.id), req.body.reason);
    res.json({ success: true, data: result });
  }

  async refundLead(req: Request, res: Response) {
    const result = await service.refundLead(req.user!.id, parseInt(req.params.id), req.body.reason);
    res.json({ success: true, data: result });
  }

  async adjustWallet(req: Request, res: Response) {
    const result = await service.adjustWallet(
      req.user!.id,
      req.params.id,
      req.body.amount,
      req.body.reason
    );
    res.json({ success: true, data: result });
  }

  async getSummary(_req: Request, res: Response) {
    const result = await service.getSummary();
    res.json({ success: true, data: result });
  }
}