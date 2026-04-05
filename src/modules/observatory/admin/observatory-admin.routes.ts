import { Router } from 'express';
import { ObservatoryAdminController } from './observatory-admin.controller';
import { observatoryAuthMiddleware } from '../../../middleware/observatory-auth.middleware';
import { validate } from '../../../middleware/validate.middleware';
import {
  submitProspectSchema,
  rejectProspectSchema,
  greenRoofSchema,
  candidateRoofSchema,
  validationRecordSchema,
  humedalSchema,
  hallazgoSchema,
} from './observatory-admin.validation';
import { asyncHandler } from '../../../utils/asyncHandler';

const router = Router({ mergeParams: true });
const c = new ObservatoryAdminController();
const auth = observatoryAuthMiddleware;

// ══════════════════════════════════════
//  Summary
// ══════════════════════════════════════
router.get('/:observatory/admin/summary', auth, asyncHandler(c.getSummary));

// ══════════════════════════════════════
//  Prospectos — Admin CRUD
// ══════════════════════════════════════
router.get('/:observatory/admin/prospectos', auth, asyncHandler(c.listProspects));
router.get('/:observatory/admin/prospectos/:id', auth, asyncHandler(c.getProspect));
router.post('/:observatory/admin/prospectos/:id/aprobar', auth, asyncHandler(c.approveProspect));
router.post('/:observatory/admin/prospectos/:id/rechazar', auth, validate(rejectProspectSchema), asyncHandler(c.rejectProspect));

// Prospectos — Public submit (for detector)
router.post('/:observatory/prospectos', validate(submitProspectSchema), asyncHandler(c.submitProspect));

// ══════════════════════════════════════
//  Green Roofs (techos-verdes)
// ══════════════════════════════════════
router.get('/:observatory/admin/green-roofs', auth, asyncHandler(c.listGreenRoofs));
router.get('/:observatory/admin/green-roofs/:id', auth, asyncHandler(c.getGreenRoof));
router.post('/:observatory/admin/green-roofs', auth, validate(greenRoofSchema), asyncHandler(c.createGreenRoof));
router.patch('/:observatory/admin/green-roofs/:id', auth, asyncHandler(c.updateGreenRoof));
router.delete('/:observatory/admin/green-roofs/:id', auth, asyncHandler(c.deleteGreenRoof));

// Public read
router.get('/:observatory/green-roofs', asyncHandler(c.listGreenRoofs));
router.get('/:observatory/green-roofs/:id', asyncHandler(c.getGreenRoof));

// ══════════════════════════════════════
//  Candidate Roofs (techos-verdes)
// ══════════════════════════════════════
router.get('/:observatory/admin/candidates', auth, asyncHandler(c.listCandidates));
router.get('/:observatory/admin/candidates/:id', auth, asyncHandler(c.getCandidate));
router.post('/:observatory/admin/candidates', auth, validate(candidateRoofSchema), asyncHandler(c.createCandidate));
router.patch('/:observatory/admin/candidates/:id', auth, asyncHandler(c.updateCandidate));
router.delete('/:observatory/admin/candidates/:id', auth, asyncHandler(c.deleteCandidate));

// Public read
router.get('/:observatory/candidates', asyncHandler(c.listCandidates));
router.get('/:observatory/candidates/:id', asyncHandler(c.getCandidate));

// ══════════════════════════════════════
//  Validation Records (techos-verdes)
// ══════════════════════════════════════
router.get('/:observatory/admin/validations', auth, asyncHandler(c.listValidations));
router.get('/:observatory/admin/validations/:id', auth, asyncHandler(c.getValidation));
router.post('/:observatory/admin/validations', auth, validate(validationRecordSchema), asyncHandler(c.createValidation));
router.patch('/:observatory/admin/validations/:id', auth, asyncHandler(c.updateValidation));
router.delete('/:observatory/admin/validations/:id', auth, asyncHandler(c.deleteValidation));

// Public read
router.get('/:observatory/validations', asyncHandler(c.listValidations));

// ══════════════════════════════════════
//  Humedales
// ══════════════════════════════════════
router.get('/:observatory/admin/humedales', auth, asyncHandler(c.listHumedales));
router.get('/:observatory/admin/humedales/:id', auth, asyncHandler(c.getHumedal));
router.post('/:observatory/admin/humedales', auth, validate(humedalSchema), asyncHandler(c.createHumedal));
router.patch('/:observatory/admin/humedales/:id', auth, asyncHandler(c.updateHumedal));
router.delete('/:observatory/admin/humedales/:id', auth, asyncHandler(c.deleteHumedal));

// Public read
router.get('/:observatory/humedales', asyncHandler(c.listHumedales));
router.get('/:observatory/humedales/:id', asyncHandler(c.getHumedal));

// ══════════════════════════════════════
//  Hallazgos
// ══════════════════════════════════════
router.get('/:observatory/admin/hallazgos', auth, asyncHandler(c.listHallazgos));
router.get('/:observatory/admin/hallazgos/:id', auth, asyncHandler(c.getHallazgo));
router.post('/:observatory/admin/hallazgos', auth, validate(hallazgoSchema), asyncHandler(c.createHallazgo));
router.patch('/:observatory/admin/hallazgos/:id', auth, asyncHandler(c.updateHallazgo));
router.delete('/:observatory/admin/hallazgos/:id', auth, asyncHandler(c.deleteHallazgo));

// Public read
router.get('/:observatory/hallazgos', asyncHandler(c.listHallazgos));
router.get('/:observatory/hallazgos/:id', asyncHandler(c.getHallazgo));

export default router;
