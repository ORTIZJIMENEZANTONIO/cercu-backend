import { Router } from 'express';
import { AIController } from './ai.controller';
import { asyncHandler } from '../../../utils/asyncHandler';

const router = Router({ mergeParams: true });
const c = new AIController();

// POST /api/v1/observatory/:observatory/ai/analyze-roof
router.post('/:observatory/ai/analyze-roof', asyncHandler(c.analyzeRoof));

export default router;
