import { Router } from 'express';
import { RemoteSensingController } from './remote-sensing.controller';
import { asyncHandler } from '../../../utils/asyncHandler';

const router = Router({ mergeParams: true });
const c = new RemoteSensingController();

// POST /api/v1/observatory/:observatory/remote-sensing/indices
// Both observatories (techos-verdes, humedales) use the same endpoint
router.post('/:observatory/remote-sensing/indices', asyncHandler(c.getIndices));

export default router;
