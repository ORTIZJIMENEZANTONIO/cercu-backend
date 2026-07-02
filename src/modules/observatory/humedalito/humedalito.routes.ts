import { Router } from 'express';
import { HumedalitoController } from './humedalito.controller';
import { asyncHandler } from '../../../utils/asyncHandler';

const router = Router({ mergeParams: true });
const c = new HumedalitoController();

// POST /api/v1/observatory/:observatory/humedalito/chat  (público, sin auth)
router.post('/:observatory/humedalito/chat', asyncHandler(c.chat.bind(c)));

export default router;
