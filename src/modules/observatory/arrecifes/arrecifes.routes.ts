import { Router } from 'express';
import { ArrecifesController } from './arrecifes.controller';
import { observatoryAuthMiddleware } from '../../../middleware/observatory-auth.middleware';
import { validate } from '../../../middleware/validate.middleware';
import {
  reefSchema,
  conflictSchema,
  contributorSchema,
  observationSubmitSchema,
  observationReviewSchema,
  bleachingAlertSchema,
  layerSchema,
  tierSchema,
  reefNewsSchema,
  reefNewsProspectRejectSchema,
  coastalIntrusionVerifySchema,
  coastalIntrusionDismissSchema,
  coastalIntrusionEscalateSchema,
} from './arrecifes.validation';
import { uploadLayerFile } from './arrecifes.upload';
import { asyncHandler } from '../../../utils/asyncHandler';

const router = Router({ mergeParams: true });
const c = new ArrecifesController();
const auth = observatoryAuthMiddleware;

// Mounted at /api/v1/observatory — all routes here are arrecifes-specific.
// We hard-code "arrecifes" in the path so the auth middleware's observatory check
// matches against admin.observatories.includes('arrecifes').

// Inject the path param so observatoryAuthMiddleware sees it
const scope = (req: any, _res: any, next: any) => {
  req.params.observatory = 'arrecifes';
  next();
};

// ─── Summary ───
router.get('/arrecifes/admin/summary', scope, auth, asyncHandler(c.getSummary));

// ─── Reefs ───
router.get('/arrecifes/admin/reefs', scope, auth, asyncHandler(c.listReefs));
router.get('/arrecifes/admin/reefs/:id', scope, auth, asyncHandler(c.getReef));
router.post('/arrecifes/admin/reefs', scope, auth, validate(reefSchema), asyncHandler(c.createReef));
router.patch('/arrecifes/admin/reefs/:id', scope, auth, asyncHandler(c.updateReef));
router.delete('/arrecifes/admin/reefs/:id', scope, auth, asyncHandler(c.deleteReef));
router.post('/arrecifes/admin/reefs/refresh-climate', scope, auth, asyncHandler(c.refreshAllReefClimate));
router.post('/arrecifes/admin/reefs/:id/refresh-climate', scope, auth, asyncHandler(c.refreshReefClimate));

// ── Snapshots / serie de tiempo (admin trigger + lecturas públicas) ──
router.post('/arrecifes/admin/reefs/snapshot', scope, auth, asyncHandler(c.snapshotAllReefs));
router.delete('/arrecifes/admin/reefs/snapshots/:id', scope, auth, asyncHandler(c.deleteReefSnapshot));
router.get('/arrecifes/reefs/metrics', asyncHandler(c.listAllReefMetrics));
router.get('/arrecifes/reefs/:id/metrics', asyncHandler(c.listReefMetrics));

// Public read (visible + not archived)
router.get('/arrecifes/reefs', asyncHandler(c.listReefsPublic));
router.get('/arrecifes/reefs/:id', asyncHandler(c.getReef));

// ─── Conflicts ───
router.get('/arrecifes/admin/conflicts', scope, auth, asyncHandler(c.listConflicts));
router.get('/arrecifes/admin/conflicts/:id', scope, auth, asyncHandler(c.getConflict));
router.post('/arrecifes/admin/conflicts', scope, auth, validate(conflictSchema), asyncHandler(c.createConflict));
router.patch('/arrecifes/admin/conflicts/:id', scope, auth, asyncHandler(c.updateConflict));
router.delete('/arrecifes/admin/conflicts/:id', scope, auth, asyncHandler(c.deleteConflict));

router.get('/arrecifes/conflicts', asyncHandler(c.listConflictsPublic));
router.get('/arrecifes/conflicts/:id', asyncHandler(c.getConflict));

// ─── Contributors ───
router.get('/arrecifes/admin/contributors', scope, auth, asyncHandler(c.listContributors));
router.get('/arrecifes/admin/contributors/:id', scope, auth, asyncHandler(c.getContributor));
router.post('/arrecifes/admin/contributors', scope, auth, validate(contributorSchema), asyncHandler(c.createContributor));
router.patch('/arrecifes/admin/contributors/:id', scope, auth, asyncHandler(c.updateContributor));
router.delete('/arrecifes/admin/contributors/:id', scope, auth, asyncHandler(c.deleteContributor));

router.get('/arrecifes/contributors', asyncHandler(c.listContributorsPublic));
router.get('/arrecifes/contributors/:id', asyncHandler(c.getContributor));

// ─── Observations ───
router.get('/arrecifes/admin/observations', scope, auth, asyncHandler(c.listObservations));
router.get('/arrecifes/admin/observations/:id', scope, auth, asyncHandler(c.getObservation));
router.post('/arrecifes/admin/observations', scope, auth, asyncHandler(c.createObservationAdmin));
router.post('/arrecifes/admin/observations/:id/review', scope, auth, validate(observationReviewSchema), asyncHandler(c.reviewObservation));
router.patch('/arrecifes/admin/observations/:id', scope, auth, asyncHandler(c.updateObservation));
router.delete('/arrecifes/admin/observations/:id', scope, auth, asyncHandler(c.deleteObservation));

// Public read (only validated)
router.get('/arrecifes/observations', asyncHandler(c.listObservationsPublic));
router.get('/arrecifes/observations/:id', asyncHandler(c.getObservation));

// Public submission (citizen contribution → pending)
router.post('/arrecifes/observations', validate(observationSubmitSchema), asyncHandler(c.submitObservation));

// ─── Bleaching Alerts ───
router.get('/arrecifes/alerts/bleaching', asyncHandler(c.listAlerts));
router.post('/arrecifes/admin/alerts/bleaching', scope, auth, validate(bleachingAlertSchema), asyncHandler(c.createAlert));
router.get('/arrecifes/admin/alerts/bleaching', scope, auth, asyncHandler(c.listAlerts));
router.patch('/arrecifes/admin/alerts/bleaching/:id', scope, auth, asyncHandler(c.updateAlert));
router.delete('/arrecifes/admin/alerts/bleaching/:id', scope, auth, asyncHandler(c.deleteAlert));

// ─── Layers ───
// Admin CRUD
router.get('/arrecifes/admin/layers', scope, auth, asyncHandler(c.listLayers));
router.get('/arrecifes/admin/layers/:id', scope, auth, asyncHandler(c.getLayer));
router.post('/arrecifes/admin/layers', scope, auth, validate(layerSchema), asyncHandler(c.createLayer));
router.patch('/arrecifes/admin/layers/:id', scope, auth, asyncHandler(c.updateLayer));
router.delete('/arrecifes/admin/layers/:id', scope, auth, asyncHandler(c.deleteLayer));
// Upload binario (multer; el field se llama "file")
router.post('/arrecifes/admin/layers/:id/upload', scope, auth, uploadLayerFile, asyncHandler(c.uploadLayerFile));

// Público — catálogo + descarga
router.get('/arrecifes/layers', asyncHandler(c.listLayersPublic));
router.get('/arrecifes/layers/:id', asyncHandler(c.getLayer));
router.get('/arrecifes/layers/:id/download', asyncHandler(c.downloadLayer));

// ─── Tiers (escala reputacional) ───
router.get('/arrecifes/admin/tiers', scope, auth, asyncHandler(c.listTiers));
router.get('/arrecifes/admin/tiers/:id', scope, auth, asyncHandler(c.getTier));
router.post('/arrecifes/admin/tiers', scope, auth, validate(tierSchema), asyncHandler(c.createTier));
router.patch('/arrecifes/admin/tiers/:id', scope, auth, asyncHandler(c.updateTier));
router.delete('/arrecifes/admin/tiers/:id', scope, auth, asyncHandler(c.deleteTier));

router.get('/arrecifes/tiers', asyncHandler(c.listTiersPublic));
router.get('/arrecifes/tiers/:id', asyncHandler(c.getTier));

// ─── Reef News (editorial) ───
// Admin CRUD
router.get('/arrecifes/admin/news', scope, auth, asyncHandler(c.listReefNews));
router.get('/arrecifes/admin/news/:id', scope, auth, asyncHandler(c.getReefNews));
router.post('/arrecifes/admin/news', scope, auth, validate(reefNewsSchema), asyncHandler(c.createReefNews));
router.patch('/arrecifes/admin/news/:id', scope, auth, asyncHandler(c.updateReefNews));
router.delete('/arrecifes/admin/news/:id', scope, auth, asyncHandler(c.deleteReefNews));

// Prospects + scraper trigger
router.get('/arrecifes/admin/news/prospects/list', scope, auth, asyncHandler(c.listReefNewsProspects));
router.post('/arrecifes/admin/news/prospects/:id/approve', scope, auth, asyncHandler(c.approveReefNewsProspect));
router.post('/arrecifes/admin/news/prospects/:id/reject', scope, auth, validate(reefNewsProspectRejectSchema), asyncHandler(c.rejectReefNewsProspect));
router.post('/arrecifes/admin/news/scraper/run', scope, auth, asyncHandler(c.runReefNewsScraper));

// Public read (visible + not archived)
router.get('/arrecifes/news', asyncHandler(c.listReefNewsPublic));
router.get('/arrecifes/news/:id', asyncHandler(c.getReefNews));

// ─── Coastal Intrusion (detector ZOFEMAT, admin-only) ───
router.get('/arrecifes/admin/coastal-intrusions', scope, auth, asyncHandler(c.listCoastalIntrusions));
router.get('/arrecifes/admin/coastal-intrusions/:id', scope, auth, asyncHandler(c.getCoastalIntrusion));
router.post('/arrecifes/admin/coastal-intrusions/run', scope, auth, asyncHandler(c.runCoastalIntrusionDetection));
router.post('/arrecifes/admin/coastal-intrusions', scope, auth, asyncHandler(c.createCoastalIntrusion));
router.delete('/arrecifes/admin/coastal-intrusions/:id', scope, auth, asyncHandler(c.deleteCoastalIntrusion));
router.post('/arrecifes/admin/coastal-intrusions/:id/verify', scope, auth, validate(coastalIntrusionVerifySchema), asyncHandler(c.verifyCoastalIntrusion));
router.post('/arrecifes/admin/coastal-intrusions/:id/dismiss', scope, auth, validate(coastalIntrusionDismissSchema), asyncHandler(c.dismissCoastalIntrusion));
router.post('/arrecifes/admin/coastal-intrusions/:id/escalate', scope, auth, validate(coastalIntrusionEscalateSchema), asyncHandler(c.escalateCoastalIntrusion));
// Fase 2: análisis de novedad temporal vía NDBI Sentinel-2
router.post('/arrecifes/admin/coastal-intrusions/analyze-novelty-batch', scope, auth, asyncHandler(c.analyzeIntrusionNoveltyBatch));
router.post('/arrecifes/admin/coastal-intrusions/:id/analyze-novelty', scope, auth, asyncHandler(c.analyzeIntrusionNovelty));
// Fase 3: serie temporal anual (deep dive opt-in)
router.post('/arrecifes/admin/coastal-intrusions/:id/timeseries', scope, auth, asyncHandler(c.generateIntrusionTimeSeries));

export default router;
