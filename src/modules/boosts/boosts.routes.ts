import { Router } from 'express';
import { BoostsController } from './boosts.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();
const controller = new BoostsController();

// Public
router.get('/types', asyncHandler(controller.listTypes));
router.get('/promoted/:categoryId', asyncHandler(controller.getPromoted));

// Pro routes
router.use(authMiddleware);
router.use(requireRole('professional'));

router.get('/active', asyncHandler(controller.getActive));
router.post('/purchase', asyncHandler(controller.purchase));

export default router;
