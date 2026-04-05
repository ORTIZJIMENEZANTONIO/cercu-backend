import { Router } from 'express';
import { DetectorController } from './detector.controller';
import { observatoryAuthMiddleware } from '../../../middleware/observatory-auth.middleware';
import { asyncHandler } from '../../../utils/asyncHandler';

const router = Router({ mergeParams: true });
const c = new DetectorController();

// Run detection (requires admin auth)
router.post(
  '/:observatory/detector/run',
  observatoryAuthMiddleware,
  asyncHandler(c.runDetection)
);

// Submit selected candidates as prospects
router.post(
  '/:observatory/detector/submit',
  observatoryAuthMiddleware,
  asyncHandler(c.submitAsProspects)
);

export default router;
