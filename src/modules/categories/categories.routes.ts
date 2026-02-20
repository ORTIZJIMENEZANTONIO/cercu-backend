import { Router } from 'express';
import { CategoriesController } from './categories.controller';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();
const controller = new CategoriesController();

router.get('/', asyncHandler(controller.getAll));
router.get('/:id', asyncHandler(controller.getById));

export default router;