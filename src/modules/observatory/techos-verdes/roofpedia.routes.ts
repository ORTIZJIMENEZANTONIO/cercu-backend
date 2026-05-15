import { Router } from 'express';
import * as c from './roofpedia.controller';
import { observatoryAuthMiddleware } from '../../../middleware/observatory-auth.middleware';
import { asyncHandler } from '../../../utils/asyncHandler';

const router = Router({ mergeParams: true });
const auth = observatoryAuthMiddleware;

// Todos los endpoints son admin-only (subprocess + cost).
router.post('/:observatory/admin/roofpedia/scan', auth, asyncHandler(c.startScan));
router.get('/:observatory/admin/roofpedia/jobs', auth, asyncHandler(c.listJobs));
router.get('/:observatory/admin/roofpedia/jobs/running', auth, asyncHandler(c.getRunning));
router.get('/:observatory/admin/roofpedia/jobs/:publicId', auth, asyncHandler(c.getJob));
router.get('/:observatory/admin/roofpedia/jobs/:publicId/log', auth, asyncHandler(c.getJobLog));
router.post('/:observatory/admin/roofpedia/jobs/:publicId/cancel', auth, asyncHandler(c.cancelJob));

export default router;
