import { Router } from 'express';
import { GamificationController } from './gamification.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();
const controller = new GamificationController();

router.use(authMiddleware);

router.get('/dashboard', asyncHandler(controller.getDashboard));
router.get('/achievements', asyncHandler(controller.getAchievements));
router.get('/missions', asyncHandler(controller.getMissions));
router.get('/xp-history', asyncHandler(controller.getXPHistory));
router.get('/trust-score', asyncHandler(controller.getTrustScore));

export default router;
