import { Router } from 'express';
import { SubscriptionsController } from './subscriptions.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();
const controller = new SubscriptionsController();

router.use(authMiddleware);
router.use(requireRole('professional'));

router.get('/current', asyncHandler(controller.getCurrent));
router.post('/subscribe', asyncHandler(controller.subscribe));
router.post('/cancel', asyncHandler(controller.cancel));
router.post('/change-plan', asyncHandler(controller.changePlan));

export default router;
