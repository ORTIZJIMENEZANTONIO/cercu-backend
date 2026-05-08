import { Request, Response } from 'express';
import * as svc from './techos-verdes-attribution.service';

// Todos los endpoints usan :observatory pero solo techos-verdes es valido.
function assertTechosVerdes(req: Request) {
  if (req.params.observatory !== 'techos-verdes') {
    const e: any = new Error('Estos recursos solo existen para techos-verdes');
    e.statusCode = 404;
    throw e;
  }
}

// ── Tiers ───────────────────────────────────────────────────────────────────

export async function listTiers(req: Request, res: Response) {
  assertTechosVerdes(req);
  const publicOnly = !req.path.includes('/admin/');
  const out = await svc.listTiers({ publicOnly });
  res.json({ success: true, ...out });
}

export async function getTier(req: Request, res: Response) {
  assertTechosVerdes(req);
  const t = await svc.getTier(Number(req.params.id));
  res.json({ success: true, item: t });
}

export async function createTier(req: Request, res: Response) {
  assertTechosVerdes(req);
  const t = await svc.createTier(req.body);
  res.status(201).json({ success: true, item: t });
}

export async function updateTier(req: Request, res: Response) {
  assertTechosVerdes(req);
  const t = await svc.updateTier(Number(req.params.id), req.body);
  res.json({ success: true, item: t });
}

export async function deleteTier(req: Request, res: Response) {
  assertTechosVerdes(req);
  const t = await svc.deleteTier(Number(req.params.id));
  res.json({ success: true, item: t });
}

// ── Contributors ────────────────────────────────────────────────────────────

export async function listContributors(req: Request, res: Response) {
  assertTechosVerdes(req);
  const publicOnly = !req.path.includes('/admin/');
  const filters: any = {
    publicOnly,
    search: req.query.search as string | undefined,
    role: req.query.role as string | undefined,
    tier: req.query.tier as string | undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  };
  if (req.query.verified === 'true') filters.verified = true;
  else if (req.query.verified === 'false') filters.verified = false;
  const out = await svc.listContributors(filters);
  res.json({ success: true, ...out });
}

export async function getContributor(req: Request, res: Response) {
  assertTechosVerdes(req);
  const c = await svc.getContributor(Number(req.params.id));
  res.json({ success: true, item: c });
}

export async function createContributor(req: Request, res: Response) {
  assertTechosVerdes(req);
  const c = await svc.createContributor(req.body);
  res.status(201).json({ success: true, item: c });
}

export async function updateContributor(req: Request, res: Response) {
  assertTechosVerdes(req);
  const c = await svc.updateContributor(Number(req.params.id), req.body);
  res.json({ success: true, item: c });
}

export async function deleteContributor(req: Request, res: Response) {
  assertTechosVerdes(req);
  const c = await svc.deleteContributor(Number(req.params.id));
  res.json({ success: true, item: c });
}

// ── Atribucion a prospectos ─────────────────────────────────────────────────

export async function attachContributor(req: Request, res: Response) {
  assertTechosVerdes(req);
  const prospectId = Number(req.params.id);
  const { contributorId } = req.body;
  const cid = contributorId === null || contributorId === undefined ? null : Number(contributorId);
  const p = await svc.attachContributorToProspect(prospectId, cid);
  res.json({ success: true, item: p });
}
