import { Router } from 'express';
import { UsersController } from './users.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { uploadProfilePicture } from '../../middleware/upload.middleware';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();
const controller = new UsersController();

router.use(authMiddleware);

router.get('/profile', asyncHandler(controller.getProfile));
router.patch('/profile', asyncHandler(controller.updateProfile));
router.post('/profile-picture', uploadProfilePicture, asyncHandler(controller.uploadProfilePicture));
router.patch('/role', asyncHandler(controller.upgradeRole));
router.get('/leads', asyncHandler(controller.getLeads));

export default router;