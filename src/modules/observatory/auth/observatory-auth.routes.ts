import { Router } from 'express';
import { ObservatoryAuthController } from './observatory-auth.controller';
import { observatoryAuthMiddleware } from '../../../middleware/observatory-auth.middleware';
import { authRateLimiter } from '../../../middleware/rateLimiter.middleware';
import { validate } from '../../../middleware/validate.middleware';
import { loginSchema } from './observatory-auth.validation';
import { asyncHandler } from '../../../utils/asyncHandler';

const router = Router();
const controller = new ObservatoryAuthController();

router.post(
  '/login',
  authRateLimiter,
  validate(loginSchema),
  asyncHandler(controller.login)
);

router.get(
  '/me',
  observatoryAuthMiddleware,
  asyncHandler(controller.me)
);

export default router;
