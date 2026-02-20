import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { authRateLimiter } from '../../middleware/rateLimiter.middleware';
import { validate } from '../../middleware/validate.middleware';
import { requestOtpSchema, verifyOtpSchema, googleAuthSchema, refreshTokenSchema } from './auth.validation';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();
const controller = new AuthController();

router.post(
  '/request-otp',
  authRateLimiter,
  validate(requestOtpSchema),
  asyncHandler(controller.requestOtp)
);

router.post(
  '/verify-otp',
  authRateLimiter,
  validate(verifyOtpSchema),
  asyncHandler(controller.verifyOtp)
);

router.post(
  '/google',
  authRateLimiter,
  validate(googleAuthSchema),
  asyncHandler(controller.googleAuth)
);

router.post(
  '/refresh',
  validate(refreshTokenSchema),
  asyncHandler(controller.refresh)
);

router.post(
  '/logout',
  authMiddleware,
  asyncHandler(controller.logout)
);

router.get(
  '/me',
  authMiddleware,
  asyncHandler(controller.me)
);

export default router;