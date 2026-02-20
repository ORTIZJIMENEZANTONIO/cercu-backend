import { Router } from 'express';
import { WalletController } from './wallet.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();
const controller = new WalletController();

router.use(authMiddleware);

router.get('/', asyncHandler(controller.getBalance));
router.get('/transactions', asyncHandler(controller.getTransactions));
router.post('/topup', asyncHandler(controller.topup));

export default router;