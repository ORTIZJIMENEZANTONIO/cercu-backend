import { Router } from 'express';
import { ProfessionalsController } from './professionals.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();
const controller = new ProfessionalsController();

// Public
router.get('/public/:id', asyncHandler(controller.getPublicProfile));

// Protected
router.use(authMiddleware);

router.post('/onboard', asyncHandler(controller.onboard));
router.get('/profile', requireRole('professional', 'admin'), asyncHandler(controller.getProfile));
router.patch('/profile', requireRole('professional', 'admin'), asyncHandler(controller.updateProfile));
router.put('/categories', requireRole('professional', 'admin'), asyncHandler(controller.updateCategories));
router.put('/schedule', requireRole('professional', 'admin'), asyncHandler(controller.updateSchedule));
router.patch('/availability', requireRole('professional', 'admin'), asyncHandler(controller.toggleAvailability));
router.get('/leads', requireRole('professional', 'admin'), asyncHandler(controller.getLeads));
router.get('/leads/:id/preview', requireRole('professional', 'admin'), asyncHandler(controller.getLeadPreview));
router.post('/leads/:id/take', requireRole('professional', 'admin'), asyncHandler(controller.takeLead));
router.post('/leads/:id/decline', requireRole('professional', 'admin'), asyncHandler(controller.declineLead));

export default router;