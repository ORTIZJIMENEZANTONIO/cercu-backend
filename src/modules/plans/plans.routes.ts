import { Router } from 'express';
import { PlansController } from './plans.controller';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();
const controller = new PlansController();

router.get('/', asyncHandler(controller.listPlans));
router.get('/:id', asyncHandler(controller.getPlan));

export default router;
