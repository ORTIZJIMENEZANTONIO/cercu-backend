import { Router } from 'express';
import { LeadsController } from './leads.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { leadsRateLimiter } from '../../middleware/rateLimiter.middleware';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();
const controller = new LeadsController();

router.use(authMiddleware);

router.post('/', leadsRateLimiter, asyncHandler(controller.create));
router.get('/', asyncHandler(controller.getMyLeads));
router.get('/:id', asyncHandler(controller.getById));
router.patch('/:id/status', asyncHandler(controller.updateStatus));
router.post('/:id/cancel', asyncHandler(controller.cancel));

export default router;