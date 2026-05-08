import { Router } from 'express';
import * as c from './comunidad.controller';
import { validate } from '../../../middleware/validate.middleware';
import { comunidadAporteSchema } from '../admin/observatory-admin.validation';
import { asyncHandler } from '../../../utils/asyncHandler';

const router = Router({ mergeParams: true });

// ══════════════════════════════════════════════════════════════════════════
//  Comunidad — Aportes publicos (sin auth)
//
//  Esta ruta es publica intencionalmente: recibe aportes desde el formulario
//  de /comunidad. Internamente crea un ProspectSubmission con source='comunidad'
//  y status='pendiente' para revision manual desde /admin/prospectos.
//
//  Aplicable a cualquier observatorio que reuse el sistema:
//    POST /api/v1/observatory/techos-verdes/comunidad/aportes
//    POST /api/v1/observatory/humedales/comunidad/aportes
//    POST /api/v1/observatory/arrecifes/comunidad/aportes
// ══════════════════════════════════════════════════════════════════════════

router.post(
  '/:observatory/comunidad/aportes',
  validate(comunidadAporteSchema),
  asyncHandler(c.submitAporte),
);

export default router;
