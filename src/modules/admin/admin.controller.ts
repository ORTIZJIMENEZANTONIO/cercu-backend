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

  // Categories
  async listCategories(_req: Request, res: Response) {
    const result = await service.listCategories();
    res.json({ success: true, data: result });
  }

  async getCategory(req: Request, res: Response) {
    const result = await service.getCategory(parseInt(req.params.id));
    res.json({ success: true, data: result });
  }

  async createCategory(req: Request, res: Response) {
    const result = await service.createCategory(req.body);
    res.status(201).json({ success: true, data: result });
  }

  async updateCategory(req: Request, res: Response) {
    const result = await service.updateCategory(parseInt(req.params.id), req.body);
    res.json({ success: true, data: result });
  }

  async deleteCategory(req: Request, res: Response) {
    const result = await service.deleteCategory(parseInt(req.params.id));
    res.json({ success: true, ...result });
  }

  // Chips
  async addChip(req: Request, res: Response) {
    const result = await service.addChip(parseInt(req.params.categoryId), req.body);
    res.status(201).json({ success: true, data: result });
  }

  async updateChip(req: Request, res: Response) {
    const result = await service.updateChip(parseInt(req.params.id), req.body);
    res.json({ success: true, data: result });
  }

  async deleteChip(req: Request, res: Response) {
    const result = await service.deleteChip(parseInt(req.params.id));
    res.json({ success: true, ...result });
  }

  // Conditional Fields
  async addField(req: Request, res: Response) {
    const result = await service.addField(parseInt(req.params.categoryId), req.body);
    res.status(201).json({ success: true, data: result });
  }

  async updateField(req: Request, res: Response) {
    const result = await service.updateField(parseInt(req.params.id), req.body);
    res.json({ success: true, data: result });
  }

  async deleteField(req: Request, res: Response) {
    const result = await service.deleteField(parseInt(req.params.id));
    res.json({ success: true, ...result });
  }

  // Pricing
  async setPricing(req: Request, res: Response) {
    const result = await service.setPricing(parseInt(req.params.categoryId), req.body);
    res.json({ success: true, data: result });
  }

  async deletePricing(req: Request, res: Response) {
    const result = await service.deletePricing(parseInt(req.params.id));
    res.json({ success: true, ...result });
  }

  // Pending Profile Changes
  async listPendingChanges(_req: Request, res: Response) {
    const result = await service.listPendingChanges();
    res.json({ success: true, data: result });
  }

  async approveChange(req: Request, res: Response) {
    const result = await service.approveChange(req.user!.id, parseInt(req.params.id));
    res.json({ success: true, data: result });
  }

  async rejectChange(req: Request, res: Response) {
    const result = await service.rejectChange(req.user!.id, parseInt(req.params.id), req.body.adminNotes);
    res.json({ success: true, data: result });
  }

  // Plans CRUD
  async listAdminPlans(_req: Request, res: Response) {
    const result = await service.listAdminPlans();
    res.json({ success: true, data: result });
  }

  async createPlan(req: Request, res: Response) {
    const result = await service.createPlan(req.user!.id, req.body);
    res.status(201).json({ success: true, data: result });
  }

  async updatePlan(req: Request, res: Response) {
    const result = await service.updatePlan(req.user!.id, parseInt(req.params.id), req.body);
    res.json({ success: true, data: result });
  }

  async deletePlan(req: Request, res: Response) {
    const result = await service.deletePlan(req.user!.id, parseInt(req.params.id));
    res.json({ success: true, ...result });
  }

  // Boost Types CRUD
  async listBoostTypes(_req: Request, res: Response) {
    const result = await service.listBoostTypes();
    res.json({ success: true, data: result });
  }

  async createBoostType(req: Request, res: Response) {
    const result = await service.createBoostType(req.user!.id, req.body);
    res.status(201).json({ success: true, data: result });
  }

  async updateBoostType(req: Request, res: Response) {
    const result = await service.updateBoostType(req.user!.id, parseInt(req.params.id), req.body);
    res.json({ success: true, data: result });
  }

  async deleteBoostType(req: Request, res: Response) {
    const result = await service.deleteBoostType(req.user!.id, parseInt(req.params.id));
    res.json({ success: true, ...result });
  }

  // Levels CRUD
  async listLevels(_req: Request, res: Response) {
    const result = await service.listLevels();
    res.json({ success: true, data: result });
  }

  async createLevel(req: Request, res: Response) {
    const result = await service.createLevel(req.user!.id, req.body);
    res.status(201).json({ success: true, data: result });
  }

  async updateLevel(req: Request, res: Response) {
    const result = await service.updateLevel(req.user!.id, parseInt(req.params.id), req.body);
    res.json({ success: true, data: result });
  }

  async deleteLevel(req: Request, res: Response) {
    const result = await service.deleteLevel(req.user!.id, parseInt(req.params.id));
    res.json({ success: true, ...result });
  }

  // Achievements CRUD
  async listAchievements(_req: Request, res: Response) {
    const result = await service.listAchievements();
    res.json({ success: true, data: result });
  }

  async createAchievement(req: Request, res: Response) {
    const result = await service.createAchievement(req.user!.id, req.body);
    res.status(201).json({ success: true, data: result });
  }

  async updateAchievement(req: Request, res: Response) {
    const result = await service.updateAchievement(req.user!.id, parseInt(req.params.id), req.body);
    res.json({ success: true, data: result });
  }

  async deleteAchievement(req: Request, res: Response) {
    const result = await service.deleteAchievement(req.user!.id, parseInt(req.params.id));
    res.json({ success: true, ...result });
  }

  // Mission Templates CRUD
  async listMissionTemplates(_req: Request, res: Response) {
    const result = await service.listMissionTemplates();
    res.json({ success: true, data: result });
  }

  async createMissionTemplate(req: Request, res: Response) {
    const result = await service.createMissionTemplate(req.user!.id, req.body);
    res.status(201).json({ success: true, data: result });
  }

  async updateMissionTemplate(req: Request, res: Response) {
    const result = await service.updateMissionTemplate(req.user!.id, parseInt(req.params.id), req.body);
    res.json({ success: true, data: result });
  }

  async deleteMissionTemplate(req: Request, res: Response) {
    const result = await service.deleteMissionTemplate(req.user!.id, parseInt(req.params.id));
    res.json({ success: true, ...result });
  }

  // Config KV
  async listConfigKV(_req: Request, res: Response) {
    const result = await service.listConfigKV();
    res.json({ success: true, data: result });
  }

  async getConfigKV(req: Request, res: Response) {
    const result = await service.getConfigKV(req.params.key);
    res.json({ success: true, data: result });
  }

  async setConfigKV(req: Request, res: Response) {
    const result = await service.setConfigKV(req.user!.id, req.params.key, req.body.value, req.body.description);
    res.json({ success: true, data: result });
  }

  async deleteConfigKV(req: Request, res: Response) {
    const result = await service.deleteConfigKV(req.params.key);
    res.json({ success: true, ...result });
  }

  // XP Grant
  async grantXP(req: Request, res: Response) {
    const result = await service.adminGrantXP(req.user!.id, req.body.userId, req.body.amount, req.body.notes);
    res.json({ success: true, data: result });
  }

  // Audit Logs
  async listAuditLogs(req: Request, res: Response) {
    const result = await service.listAuditLogs(req.query);
    res.json({ success: true, ...result });
  }
}