import { Router } from 'express';
import * as c from './techos-verdes-attribution.controller';
import { observatoryAuthMiddleware } from '../../../middleware/observatory-auth.middleware';
import { asyncHandler } from '../../../utils/asyncHandler';

const router = Router({ mergeParams: true });
const auth = observatoryAuthMiddleware;

// ══════════════════════════════════════════════════════════════════════════
//  Techos Verdes — Tiers
// ══════════════════════════════════════════════════════════════════════════

router.get('/:observatory/tiers', asyncHandler(c.listTiers));
router.get('/:observatory/tiers/:id', asyncHandler(c.getTier));

router.get('/:observatory/admin/tiers', auth, asyncHandler(c.listTiers));
router.get('/:observatory/admin/tiers/:id', auth, asyncHandler(c.getTier));
router.post('/:observatory/admin/tiers', auth, asyncHandler(c.createTier));
router.patch('/:observatory/admin/tiers/:id', auth, asyncHandler(c.updateTier));
router.delete('/:observatory/admin/tiers/:id', auth, asyncHandler(c.deleteTier));

// ══════════════════════════════════════════════════════════════════════════
//  Techos Verdes — Contributors
// ══════════════════════════════════════════════════════════════════════════

router.get('/:observatory/contributors', asyncHandler(c.listContributors));
router.get('/:observatory/contributors/:id', asyncHandler(c.getContributor));

router.get('/:observatory/admin/contributors', auth, asyncHandler(c.listContributors));
router.get('/:observatory/admin/contributors/:id', auth, asyncHandler(c.getContributor));
router.post('/:observatory/admin/contributors', auth, asyncHandler(c.createContributor));
router.patch('/:observatory/admin/contributors/:id', auth, asyncHandler(c.updateContributor));
router.delete('/:observatory/admin/contributors/:id', auth, asyncHandler(c.deleteContributor));

// ══════════════════════════════════════════════════════════════════════════
//  Atribucion: vincular un prospecto con un contribuyente
// ══════════════════════════════════════════════════════════════════════════

router.patch(
  '/:observatory/admin/prospectos/:id/contributor',
  auth,
  asyncHandler(c.attachContributor),
);

export default router;
