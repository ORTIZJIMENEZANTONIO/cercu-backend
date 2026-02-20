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

export default router;