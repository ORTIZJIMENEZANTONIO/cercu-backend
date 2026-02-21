import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();
const controller = new AdminController();

router.use(authMiddleware);
router.use(requireRole('admin'));

// Summary
router.get('/summary', asyncHandler(controller.getSummary));

// Users
router.get('/users', asyncHandler(controller.listUsers));
router.patch('/users/:id', asyncHandler(controller.updateUser));
router.post('/users/:id/block', asyncHandler(controller.blockUser));
router.post('/users/:id/unblock', asyncHandler(controller.unblockUser));
router.post('/users/:id/flag', asyncHandler(controller.flagUser));

// Professionals
router.get('/professionals', asyncHandler(controller.listProfessionals));
router.post('/professionals/:id/approve', asyncHandler(controller.approveProfessional));
router.post('/professionals/:id/reject', asyncHandler(controller.rejectProfessional));
router.post('/professionals/:id/suspend', asyncHandler(controller.suspendProfessional));

// Leads
router.get('/leads', asyncHandler(controller.listLeads));
router.post('/leads/:id/cancel', asyncHandler(controller.cancelLead));
router.post('/leads/:id/refund', asyncHandler(controller.refundLead));

// Wallet
router.post('/wallets/:id/adjust', asyncHandler(controller.adjustWallet));

// Pending Profile Changes
router.get('/pending-changes', asyncHandler(controller.listPendingChanges));
router.post('/pending-changes/:id/approve', asyncHandler(controller.approveChange));
router.post('/pending-changes/:id/reject', asyncHandler(controller.rejectChange));

// Categories
router.get('/categories', asyncHandler(controller.listCategories));
router.get('/categories/:id', asyncHandler(controller.getCategory));
router.post('/categories', asyncHandler(controller.createCategory));
router.patch('/categories/:id', asyncHandler(controller.updateCategory));
router.delete('/categories/:id', asyncHandler(controller.deleteCategory));

// Chips
router.post('/categories/:categoryId/chips', asyncHandler(controller.addChip));
router.patch('/chips/:id', asyncHandler(controller.updateChip));
router.delete('/chips/:id', asyncHandler(controller.deleteChip));

// Conditional Fields
router.post('/categories/:categoryId/fields', asyncHandler(controller.addField));
router.patch('/fields/:id', asyncHandler(controller.updateField));
router.delete('/fields/:id', asyncHandler(controller.deleteField));

// Pricing
router.post('/categories/:categoryId/pricing', asyncHandler(controller.setPricing));
router.delete('/pricing/:id', asyncHandler(controller.deletePricing));

// Plans CRUD
router.get('/plans', asyncHandler(controller.listAdminPlans));
router.post('/plans', asyncHandler(controller.createPlan));
router.patch('/plans/:id', asyncHandler(controller.updatePlan));
router.delete('/plans/:id', asyncHandler(controller.deletePlan));

// Boost Types CRUD
router.get('/boost-types', asyncHandler(controller.listBoostTypes));
router.post('/boost-types', asyncHandler(controller.createBoostType));
router.patch('/boost-types/:id', asyncHandler(controller.updateBoostType));
router.delete('/boost-types/:id', asyncHandler(controller.deleteBoostType));

// Levels CRUD
router.get('/levels', asyncHandler(controller.listLevels));
router.post('/levels', asyncHandler(controller.createLevel));
router.patch('/levels/:id', asyncHandler(controller.updateLevel));
router.delete('/levels/:id', asyncHandler(controller.deleteLevel));

// Achievements CRUD
router.get('/achievements', asyncHandler(controller.listAchievements));
router.post('/achievements', asyncHandler(controller.createAchievement));
router.patch('/achievements/:id', asyncHandler(controller.updateAchievement));
router.delete('/achievements/:id', asyncHandler(controller.deleteAchievement));

// Mission Templates CRUD
router.get('/mission-templates', asyncHandler(controller.listMissionTemplates));
router.post('/mission-templates', asyncHandler(controller.createMissionTemplate));
router.patch('/mission-templates/:id', asyncHandler(controller.updateMissionTemplate));
router.delete('/mission-templates/:id', asyncHandler(controller.deleteMissionTemplate));

// Config KV
router.get('/config', asyncHandler(controller.listConfigKV));
router.get('/config/:key', asyncHandler(controller.getConfigKV));
router.put('/config/:key', asyncHandler(controller.setConfigKV));
router.delete('/config/:key', asyncHandler(controller.deleteConfigKV));

// XP Grant
router.post('/xp/grant', asyncHandler(controller.grantXP));

// Audit Log
router.get('/audit-logs', asyncHandler(controller.listAuditLogs));

export default router;