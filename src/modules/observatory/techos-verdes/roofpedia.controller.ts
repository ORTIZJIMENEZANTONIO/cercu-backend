import { Request, Response } from 'express';
import * as svc from './roofpedia.service';
import { RoofpediaJobStatus } from '../../../entities/observatory/RoofpediaJob';
import { AppError } from '../../../middleware/errorHandler.middleware';

function assertTechosVerdes(req: Request) {
  if (req.params.observatory !== 'techos-verdes') {
    throw new AppError('Roofpedia solo disponible para techos-verdes', 404);
  }
}

function serializeJob(j: any) {
  return {
    publicId: j.publicId,
    observatory: j.observatory,
    alcaldiaSlug: j.alcaldiaSlug,
    alcaldiaNombre: j.alcaldiaNombre,
    status: j.status,
    requestedBy: j.requestedBy,
    costEstimateUsd: Number(j.costEstimateUsd ?? 0),
    startedAt: j.startedAt,
    finishedAt: j.finishedAt,
    errorMessage: j.errorMessage,
    result: j.result,
    createdAt: j.createdAt,
    // pid y logPath son internos — no se exponen
  };
}

// POST /:observatory/admin/roofpedia/scan
export async function startScan(req: Request, res: Response) {
  assertTechosVerdes(req);
  const { alcaldiaNombre, costEstimateUsd } = req.body ?? {};
  if (!alcaldiaNombre || typeof alcaldiaNombre !== 'string') {
    throw new AppError('alcaldiaNombre es requerido', 400);
  }
  const requestedBy = (req as any).user?.id;
  if (!requestedBy) throw new AppError('No identificado', 401);

  const job = await svc.startScan({
    observatory: req.params.observatory,
    alcaldiaNombre: alcaldiaNombre.trim(),
    requestedBy,
    costEstimateUsd: Number.isFinite(Number(costEstimateUsd))
      ? Number(costEstimateUsd)
      : 0,
  });
  res.status(202).json({ success: true, job: serializeJob(job) });
}

// GET /:observatory/admin/roofpedia/jobs
export async function listJobs(req: Request, res: Response) {
  assertTechosVerdes(req);
  const statusRaw = String(req.query.status ?? '');
  const status = Object.values(RoofpediaJobStatus).includes(statusRaw as any)
    ? (statusRaw as RoofpediaJobStatus)
    : undefined;
  const limit = req.query.limit ? Math.min(200, Number(req.query.limit)) : 50;
  const out = await svc.listJobs({
    observatory: req.params.observatory,
    status,
    limit,
  });
  res.json({
    success: true,
    items: out.items.map(serializeJob),
    total: out.total,
  });
}

// GET /:observatory/admin/roofpedia/jobs/running
export async function getRunning(req: Request, res: Response) {
  assertTechosVerdes(req);
  const job = await svc.getRunningJob(req.params.observatory);
  res.json({ success: true, job: job ? serializeJob(job) : null });
}

// GET /:observatory/admin/roofpedia/jobs/:publicId
export async function getJob(req: Request, res: Response) {
  assertTechosVerdes(req);
  const job = await svc.getJobByPublicId(req.params.publicId);
  res.json({ success: true, job: serializeJob(job) });
}

// GET /:observatory/admin/roofpedia/jobs/:publicId/log
export async function getJobLog(req: Request, res: Response) {
  assertTechosVerdes(req);
  const lines = req.query.lines ? Math.min(2000, Number(req.query.lines)) : 200;
  const tail = await svc.tailLog(req.params.publicId, lines);
  res.json({ success: true, tail });
}

// POST /:observatory/admin/roofpedia/jobs/:publicId/cancel
export async function cancelJob(req: Request, res: Response) {
  assertTechosVerdes(req);
  const job = await svc.cancelJob(req.params.publicId);
  res.json({ success: true, job: serializeJob(job) });
}
