import { Router } from 'express';
import { GuardianesController } from './guardianes.controller';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();
const controller = new GuardianesController();

// Public endpoints — no auth required (game is for kids, no login)
router.post('/events', asyncHandler(controller.postEvent));
router.get('/stats', asyncHandler(controller.getStats));
router.get('/events', asyncHandler(controller.getEvents));

export default router;
