import { Request, Response } from 'express';
import { ArrecifesService } from './arrecifes.service';
import { CoastalIntrusionService } from './coastalIntrusion.service';

const service = new ArrecifesService();
const coastalService = new CoastalIntrusionService();

const parseBoolStr = (q: any) => (typeof q === 'string' ? q : undefined);

export class ArrecifesController {
  // ─── Summary ───
  async getSummary(_req: Request, res: Response) {
    const result = await service.getSummary();
    res.json({ success: true, data: result });
  }

  // ─── Reefs ───
  async listReefs(req: Request, res: Response) {
    const { page, limit, search, state, ocean, status, protection, visible, archived } = req.query;
    const result = await service.listReefs(
      { page: Number(page) || 1, limit: Number(limit) || 50 },
      {
        search: search as string,
        state: state as string,
        ocean: ocean as string,
        status: status as string,
        protection: protection as string,
        visible: parseBoolStr(visible),
        archived: parseBoolStr(archived),
      },
    );
    res.json({ success: true, ...result });
  }

  async listReefsPublic(req: Request, res: Response) {
    const { page, limit, search, state, ocean, status, protection } = req.query;
    const result = await service.listReefs(
      { page: Number(page) || 1, limit: Number(limit) || 50 },
      {
        search: search as string,
        state: state as string,
        ocean: ocean as string,
        status: status as string,
        protection: protection as string,
        publicOnly: true,
      },
    );
    res.json({ success: true, ...result });
  }

  async getReef(req: Request, res: Response) {
    const result = await service.getReef(Number(req.params.id));
    res.json({ success: true, data: result });
  }

  async createReef(req: Request, res: Response) {
    const result = await service.createReef(req.body);
    res.status(201).json({ success: true, data: result });
  }

  async updateReef(req: Request, res: Response) {
    const result = await service.updateReef(Number(req.params.id), req.body);
    res.json({ success: true, data: result });
  }

  async deleteReef(req: Request, res: Response) {
    const result = await service.deleteReef(Number(req.params.id));
    res.json({ success: true, data: result });
  }

  async refreshReefClimate(req: Request, res: Response) {
    const result = await service.refreshReefClimate(Number(req.params.id));
    res.json({ success: true, data: result });
  }

  async refreshAllReefClimate(_req: Request, res: Response) {
    const result = await service.refreshAllReefClimate();
    res.json({ success: true, data: result });
  }

  async snapshotAllReefs(_req: Request, res: Response) {
    const result = await service.snapshotAllReefs('manual');
    res.json({ success: true, data: result });
  }

  async deleteReefSnapshot(req: Request, res: Response) {
    const result = await service.deleteReefSnapshot(Number(req.params.id));
    res.json({ success: true, data: result });
  }

  async listReefMetrics(req: Request, res: Response) {
    const id = Number(req.params.id);
    const days = req.query.days ? Number(req.query.days) : undefined;
    const items = await service.listReefMetrics(id, days);
    res.json({ success: true, items });
  }

  async listAllReefMetrics(req: Request, res: Response) {
    const days = req.query.days ? Number(req.query.days) : undefined;
    const items = await service.listAllReefMetrics(days);
    res.json({ success: true, items });
  }

  // ─── Conflicts ───
  async listConflicts(req: Request, res: Response) {
    const { page, limit, search, state, intensity, status, visible, archived } = req.query;
    const result = await service.listConflicts(
      { page: Number(page) || 1, limit: Number(limit) || 50 },
      { search: search as string, state: state as string, intensity: intensity as string, status: status as string, visible: parseBoolStr(visible), archived: parseBoolStr(archived) },
    );
    res.json({ success: true, ...result });
  }

  async listConflictsPublic(req: Request, res: Response) {
    const { page, limit, search, state, intensity, status } = req.query;
    const result = await service.listConflicts(
      { page: Number(page) || 1, limit: Number(limit) || 50 },
      { search: search as string, state: state as string, intensity: intensity as string, status: status as string, publicOnly: true },
    );
    res.json({ success: true, ...result });
  }

  async getConflict(req: Request, res: Response) {
    const result = await service.getConflict(Number(req.params.id));
    res.json({ success: true, data: result });
  }

  async createConflict(req: Request, res: Response) {
    const result = await service.createConflict(req.body);
    res.status(201).json({ success: true, data: result });
  }

  async updateConflict(req: Request, res: Response) {
    const result = await service.updateConflict(Number(req.params.id), req.body);
    res.json({ success: true, data: result });
  }

  async deleteConflict(req: Request, res: Response) {
    const result = await service.deleteConflict(Number(req.params.id));
    res.json({ success: true, data: result });
  }

  // ─── Contributors ───
  async listContributors(req: Request, res: Response) {
    const { page, limit, search, role, tier, verified, visible, archived } = req.query;
    const result = await service.listContributors(
      { page: Number(page) || 1, limit: Number(limit) || 50 },
      { search: search as string, role: role as string, tier: tier as string, verified: parseBoolStr(verified), visible: parseBoolStr(visible), archived: parseBoolStr(archived) },
    );
    res.json({ success: true, ...result });
  }

  async listContributorsPublic(req: Request, res: Response) {
    const { page, limit, search, role, tier } = req.query;
    const result = await service.listContributors(
      { page: Number(page) || 1, limit: Number(limit) || 50 },
      { search: search as string, role: role as string, tier: tier as string, publicOnly: true },
    );
    res.json({ success: true, ...result });
  }

  async getContributor(req: Request, res: Response) {
    const result = await service.getContributor(Number(req.params.id));
    res.json({ success: true, data: result });
  }

  async createContributor(req: Request, res: Response) {
    const result = await service.createContributor(req.body);
    res.status(201).json({ success: true, data: result });
  }

  async updateContributor(req: Request, res: Response) {
    const result = await service.updateContributor(Number(req.params.id), req.body);
    res.json({ success: true, data: result });
  }

  async deleteContributor(req: Request, res: Response) {
    const result = await service.deleteContributor(Number(req.params.id));
    res.json({ success: true, data: result });
  }

  // ─── Observations ───
  async listObservations(req: Request, res: Response) {
    const { page, limit, search, reefId, type, status, contributorId, visible, archived } = req.query;
    const result = await service.listObservations(
      { page: Number(page) || 1, limit: Number(limit) || 50 },
      {
        search: search as string,
        reefId: reefId ? Number(reefId) : undefined,
        type: type as string,
        status: status as string,
        contributorId: contributorId ? Number(contributorId) : undefined,
        visible: parseBoolStr(visible),
        archived: parseBoolStr(archived),
      },
    );
    res.json({ success: true, ...result });
  }

  async listObservationsPublic(req: Request, res: Response) {
    const { page, limit, reefId, type, contributorId } = req.query;
    const result = await service.listObservations(
      { page: Number(page) || 1, limit: Number(limit) || 50 },
      {
        reefId: reefId ? Number(reefId) : undefined,
        type: type as string,
        contributorId: contributorId ? Number(contributorId) : undefined,
        publicOnly: true,
      },
    );
    res.json({ success: true, ...result });
  }

  async getObservation(req: Request, res: Response) {
    const result = await service.getObservation(Number(req.params.id));
    res.json({ success: true, data: result });
  }

  async submitObservation(req: Request, res: Response) {
    const result = await service.submitObservation(req.body);
    res.status(201).json({ success: true, data: result });
  }

  async createObservationAdmin(req: Request, res: Response) {
    const result = await service.createObservationAdmin(req.body, req.user!.id);
    res.status(201).json({ success: true, data: result });
  }

  async reviewObservation(req: Request, res: Response) {
    const result = await service.reviewObservation(Number(req.params.id), req.user!.id, req.body);
    res.json({ success: true, data: result });
  }

  async updateObservation(req: Request, res: Response) {
    const result = await service.updateObservation(Number(req.params.id), req.body);
    res.json({ success: true, data: result });
  }

  async deleteObservation(req: Request, res: Response) {
    const result = await service.deleteObservation(Number(req.params.id));
    res.json({ success: true, data: result });
  }

  // ─── Bleaching Alerts ───
  async listAlerts(req: Request, res: Response) {
    const { reefId, level, latestPerReef } = req.query;
    const result = await service.listAlerts({
      reefId: reefId ? Number(reefId) : undefined,
      level: level as string,
      latestPerReef: latestPerReef === 'true',
    });
    res.json({ success: true, ...result });
  }

  async createAlert(req: Request, res: Response) {
    const result = await service.createAlert(req.body);
    res.status(201).json({ success: true, data: result });
  }

  async updateAlert(req: Request, res: Response) {
    const result = await service.updateAlert(Number(req.params.id), req.body);
    res.json({ success: true, data: result });
  }

  async deleteAlert(req: Request, res: Response) {
    const result = await service.deleteAlert(Number(req.params.id));
    res.json({ success: true, data: result });
  }

  // ─── Layers ───
  async listLayers(req: Request, res: Response) {
    const { page, limit, search, provider, category, kind, active, visible, archived } = req.query;
    const result = await service.listLayers(
      { page: Number(page) || 1, limit: Number(limit) || 100 },
      {
        search: search as string,
        provider: provider as string,
        category: category as string,
        kind: kind as string,
        active: parseBoolStr(active),
        visible: parseBoolStr(visible),
        archived: parseBoolStr(archived),
      },
    );
    res.json({ success: true, ...result });
  }

  async listLayersPublic(req: Request, res: Response) {
    const { page, limit, search, provider, category, kind } = req.query;
    const result = await service.listLayers(
      { page: Number(page) || 1, limit: Number(limit) || 100 },
      {
        search: search as string,
        provider: provider as string,
        category: category as string,
        kind: kind as string,
        publicOnly: true,
      },
    );
    res.json({ success: true, ...result });
  }

  async getLayer(req: Request, res: Response) {
    const idParam = req.params.id;
    const idOrSlug = /^\d+$/.test(idParam) ? Number(idParam) : idParam;
    const result = await service.getLayer(idOrSlug);
    res.json({ success: true, data: result });
  }

  async createLayer(req: Request, res: Response) {
    const result = await service.createLayer(req.body);
    res.status(201).json({ success: true, data: result });
  }

  async updateLayer(req: Request, res: Response) {
    const result = await service.updateLayer(Number(req.params.id), req.body);
    res.json({ success: true, data: result });
  }

  async uploadLayerFile(req: Request, res: Response) {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'Archivo requerido (campo "file")' });
      return;
    }
    const result = await service.attachLayerFile(Number(req.params.id), req.file);
    res.json({ success: true, data: result });
  }

  async deleteLayer(req: Request, res: Response) {
    const result = await service.deleteLayer(Number(req.params.id));
    res.json({ success: true, data: result });
  }

  async downloadLayer(req: Request, res: Response) {
    const result = await service.resolveLayerDownload(Number(req.params.id));
    if (result.kind === 'redirect') {
      res.redirect(302, result.url);
      return;
    }
    res.download(result.absPath, result.fileName, { headers: { 'Content-Type': result.mimeType } });
  }

  // ─── Tiers (escala de la red) ───
  async listTiers(req: Request, res: Response) {
    const { visible, archived } = req.query;
    const result = await service.listTiers({
      visible: parseBoolStr(visible),
      archived: parseBoolStr(archived),
    });
    res.json({ success: true, ...result });
  }

  async listTiersPublic(_req: Request, res: Response) {
    const result = await service.listTiers({ publicOnly: true });
    res.json({ success: true, ...result });
  }

  async getTier(req: Request, res: Response) {
    const idParam = req.params.id;
    const idOrSlug = /^\d+$/.test(idParam) ? Number(idParam) : idParam;
    const result = await service.getTier(idOrSlug);
    res.json({ success: true, data: result });
  }

  async createTier(req: Request, res: Response) {
    const result = await service.createTier(req.body);
    res.status(201).json({ success: true, data: result });
  }

  async updateTier(req: Request, res: Response) {
    const result = await service.updateTier(Number(req.params.id), req.body);
    res.json({ success: true, data: result });
  }

  async deleteTier(req: Request, res: Response) {
    const result = await service.deleteTier(Number(req.params.id));
    res.json({ success: true, data: result });
  }

  // ─── Reef News (editorial) ───
  async listReefNews(req: Request, res: Response) {
    const { page, limit, search, tag, visible, archived } = req.query;
    const result = await service.listReefNews(
      { page: Number(page) || 1, limit: Number(limit) || 50 },
      {
        search: search as string,
        tag: tag as string,
        visible: parseBoolStr(visible) ? parseBoolStr(visible) === 'true' : undefined,
        archived: parseBoolStr(archived) ? parseBoolStr(archived) === 'true' : undefined,
      },
    );
    res.json({ success: true, ...result });
  }

  async listReefNewsPublic(req: Request, res: Response) {
    const { page, limit, search, tag } = req.query;
    const result = await service.listReefNews(
      { page: Number(page) || 1, limit: Number(limit) || 50 },
      { search: search as string, tag: tag as string, publicOnly: true },
    );
    res.json({ success: true, ...result });
  }

  async getReefNews(req: Request, res: Response) {
    const idOrSlug = /^\d+$/.test(req.params.id) ? Number(req.params.id) : req.params.id;
    const result = await service.getReefNews(idOrSlug);
    res.json({ success: true, data: result });
  }

  async createReefNews(req: Request, res: Response) {
    const result = await service.createReefNews(req.body);
    res.status(201).json({ success: true, data: result });
  }

  async updateReefNews(req: Request, res: Response) {
    const result = await service.updateReefNews(Number(req.params.id), req.body);
    res.json({ success: true, data: result });
  }

  async deleteReefNews(req: Request, res: Response) {
    const result = await service.deleteReefNews(Number(req.params.id));
    res.json({ success: true, data: result });
  }

  // ─── Reef News Prospects (cola scraper) ───
  async listReefNewsProspects(req: Request, res: Response) {
    const { status, page, limit } = req.query;
    const result = await service.listReefNewsProspects(
      status as string,
      Number(page) || 1,
      Number(limit) || 50,
    );
    res.json({ success: true, ...result });
  }

  async approveReefNewsProspect(req: Request, res: Response) {
    const adminId = (req as any).user?.id || 'unknown';
    const result = await service.approveReefNewsProspect(Number(req.params.id), adminId);
    res.json({ success: true, data: result });
  }

  async rejectReefNewsProspect(req: Request, res: Response) {
    const adminId = (req as any).user?.id || 'unknown';
    const result = await service.rejectReefNewsProspect(
      Number(req.params.id),
      adminId,
      req.body.notes || '',
    );
    res.json({ success: true, data: result });
  }

  async runReefNewsScraper(_req: Request, res: Response) {
    const result = await service.runReefNewsScraper();
    res.json({ success: true, data: result });
  }

  // ─── Coastal Intrusion (detector ZOFEMAT) ───
  async listCoastalIntrusions(req: Request, res: Response) {
    const { reefId, status, page, limit } = req.query;
    const result = await coastalService.list({
      reefId: reefId ? Number(reefId) : undefined,
      status: status as string | undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json({ success: true, ...result });
  }

  async getCoastalIntrusion(req: Request, res: Response) {
    const result = await coastalService.get(Number(req.params.id));
    res.json({ success: true, data: result });
  }

  async runCoastalIntrusionDetection(req: Request, res: Response) {
    const reefId = req.query.reefId ? Number(req.query.reefId) : undefined;
    const result = await coastalService.runDetection(reefId);
    res.json({ success: true, data: result });
  }

  // Caso manual: el revisor tiene una invasión documentada que el detector OSM
  // no captó (ej. estructura no mapeada en OpenStreetMap todavía).
  async createCoastalIntrusion(req: Request, res: Response) {
    const adminId = (req as any).user?.id || 'unknown';
    const result = await coastalService.createManual(req.body, adminId);
    res.status(201).json({ success: true, data: result });
  }

  async deleteCoastalIntrusion(req: Request, res: Response) {
    const result = await coastalService.deleteManual(Number(req.params.id));
    res.json({ success: true, data: result });
  }

  async verifyCoastalIntrusion(req: Request, res: Response) {
    const adminId = (req as any).user?.id || 'unknown';
    const result = await coastalService.verify(
      Number(req.params.id),
      adminId,
      req.body.notes,
    );
    res.json({ success: true, data: result });
  }

  async dismissCoastalIntrusion(req: Request, res: Response) {
    const adminId = (req as any).user?.id || 'unknown';
    const result = await coastalService.dismiss(
      Number(req.params.id),
      adminId,
      req.body.notes,
    );
    res.json({ success: true, data: result });
  }

  async escalateCoastalIntrusion(req: Request, res: Response) {
    const adminId = (req as any).user?.id || 'unknown';
    const result = await coastalService.escalate(
      Number(req.params.id),
      adminId,
      req.body,
    );
    res.json({ success: true, data: result });
  }

  async analyzeIntrusionNovelty(req: Request, res: Response) {
    const baselineYearsBack = req.query.baselineYearsBack
      ? Number(req.query.baselineYearsBack)
      : undefined;
    const result = await coastalService.analyzeNovelty(Number(req.params.id), {
      baselineYearsBack,
    });
    res.json({ success: true, data: result });
  }

  async analyzeIntrusionNoveltyBatch(req: Request, res: Response) {
    const result = await coastalService.analyzeNoveltyBatch({
      reefId: req.query.reefId ? Number(req.query.reefId) : undefined,
      status: req.query.status as string | undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json({ success: true, data: result });
  }

  async generateIntrusionTimeSeries(req: Request, res: Response) {
    const fromYear = req.query.fromYear ? Number(req.query.fromYear) : undefined;
    const result = await coastalService.generateNoveltyTimeSeries(
      Number(req.params.id),
      { fromYear },
    );
    res.json({ success: true, data: result });
  }
}
