import { Request, Response } from 'express';
import { ObservatoryAdminService } from './observatory-admin.service';

const service = new ObservatoryAdminService();

export class ObservatoryAdminController {
  // ──────────── Summary ────────────
  async getSummary(req: Request, res: Response) {
    const result = await service.getSummary(req.params.observatory);
    res.json({ success: true, data: result });
  }

  // ──────────── Prospectos ────────────
  async listProspects(req: Request, res: Response) {
    const { observatory } = req.params;
    const { status, page, limit } = req.query;
    const result = await service.listProspects(observatory, status as string, Number(page) || 1, Number(limit) || 20);
    res.json({ success: true, ...result });
  }

  async getProspect(req: Request, res: Response) {
    const result = await service.getProspect(Number(req.params.id));
    res.json({ success: true, data: result });
  }

  async submitProspect(req: Request, res: Response) {
    const { data, source, confianzaDetector } = req.body;
    const result = await service.submitProspect(req.params.observatory, data, source, confianzaDetector);
    res.status(201).json({ success: true, data: result });
  }

  async approveProspect(req: Request, res: Response) {
    const result = await service.approveProspect(Number(req.params.id), req.user!.id);
    res.json({ success: true, data: result });
  }

  async rejectProspect(req: Request, res: Response) {
    const result = await service.rejectProspect(Number(req.params.id), req.user!.id, req.body.notas);
    res.json({ success: true, data: result });
  }

  // ──────────── Green Roofs ────────────
  async listGreenRoofs(req: Request, res: Response) {
    const { page, limit } = req.query;
    const result = await service.listGreenRoofs(Number(page) || 1, Number(limit) || 50);
    res.json({ success: true, ...result });
  }

  async getGreenRoof(req: Request, res: Response) {
    const result = await service.getGreenRoof(Number(req.params.id));
    res.json({ success: true, data: result });
  }

  async createGreenRoof(req: Request, res: Response) {
    const result = await service.createGreenRoof(req.body);
    res.status(201).json({ success: true, data: result });
  }

  async updateGreenRoof(req: Request, res: Response) {
    const result = await service.updateGreenRoof(Number(req.params.id), req.body);
    res.json({ success: true, data: result });
  }

  async deleteGreenRoof(req: Request, res: Response) {
    const result = await service.deleteGreenRoof(Number(req.params.id));
    res.json({ success: true, data: result });
  }

  // ──────────── Candidates ────────────
  async listCandidates(req: Request, res: Response) {
    const { page, limit } = req.query;
    const result = await service.listCandidates(Number(page) || 1, Number(limit) || 50);
    res.json({ success: true, ...result });
  }

  async getCandidate(req: Request, res: Response) {
    const result = await service.getCandidate(Number(req.params.id));
    res.json({ success: true, data: result });
  }

  async createCandidate(req: Request, res: Response) {
    const result = await service.createCandidate(req.body);
    res.status(201).json({ success: true, data: result });
  }

  async updateCandidate(req: Request, res: Response) {
    const result = await service.updateCandidate(Number(req.params.id), req.body);
    res.json({ success: true, data: result });
  }

  async deleteCandidate(req: Request, res: Response) {
    const result = await service.deleteCandidate(Number(req.params.id));
    res.json({ success: true, data: result });
  }

  // ──────────── Validations ────────────
  async listValidations(req: Request, res: Response) {
    const { page, limit } = req.query;
    const result = await service.listValidations(Number(page) || 1, Number(limit) || 50);
    res.json({ success: true, ...result });
  }

  async getValidation(req: Request, res: Response) {
    const result = await service.getValidation(Number(req.params.id));
    res.json({ success: true, data: result });
  }

  async createValidation(req: Request, res: Response) {
    const result = await service.createValidation(req.body);
    res.status(201).json({ success: true, data: result });
  }

  async updateValidation(req: Request, res: Response) {
    const result = await service.updateValidation(Number(req.params.id), req.body);
    res.json({ success: true, data: result });
  }

  async deleteValidation(req: Request, res: Response) {
    const result = await service.deleteValidation(Number(req.params.id));
    res.json({ success: true, data: result });
  }

  // ──────────── Humedales ────────────
  async listHumedales(req: Request, res: Response) {
    const { page, limit, search, alcaldia, tipoHumedal, estado, visible, archivado } = req.query;
    const result = await service.listHumedales(
      Number(page) || 1,
      Number(limit) || 50,
      {
        search: search as string,
        alcaldia: alcaldia as string,
        tipoHumedal: tipoHumedal as string,
        estado: estado as string,
        visible: visible as string,
        archivado: archivado as string,
      },
    );
    res.json({ success: true, ...result });
  }

  async listHumedalesPublic(req: Request, res: Response) {
    const { page, limit, search, alcaldia, tipoHumedal, estado } = req.query;
    const result = await service.listHumedales(
      Number(page) || 1,
      Number(limit) || 50,
      { search: search as string, alcaldia: alcaldia as string, tipoHumedal: tipoHumedal as string, estado: estado as string, publicOnly: true },
    );
    res.json({ success: true, ...result });
  }

  async getHumedal(req: Request, res: Response) {
    const result = await service.getHumedal(Number(req.params.id));
    res.json({ success: true, data: result });
  }

  async createHumedal(req: Request, res: Response) {
    const result = await service.createHumedal(req.body);
    res.status(201).json({ success: true, data: result });
  }

  async updateHumedal(req: Request, res: Response) {
    const result = await service.updateHumedal(Number(req.params.id), req.body);
    res.json({ success: true, data: result });
  }

  async deleteHumedal(req: Request, res: Response) {
    const result = await service.deleteHumedal(Number(req.params.id));
    res.json({ success: true, data: result });
  }

  // ──────────── Hallazgos ────────────
  async listHallazgos(req: Request, res: Response) {
    const { page, limit, visible, archivado, impacto } = req.query;
    const result = await service.listHallazgos(Number(page) || 1, Number(limit) || 50, {
      visible: visible as string,
      archivado: archivado as string,
      impacto: impacto as string,
    });
    res.json({ success: true, ...result });
  }

  async listHallazgosPublic(req: Request, res: Response) {
    const { page, limit } = req.query;
    const result = await service.listHallazgos(Number(page) || 1, Number(limit) || 50, { publicOnly: true });
    res.json({ success: true, ...result });
  }

  async getHallazgo(req: Request, res: Response) {
    const result = await service.getHallazgo(Number(req.params.id));
    res.json({ success: true, data: result });
  }

  async createHallazgo(req: Request, res: Response) {
    const result = await service.createHallazgo(req.body);
    res.status(201).json({ success: true, data: result });
  }

  async updateHallazgo(req: Request, res: Response) {
    const result = await service.updateHallazgo(Number(req.params.id), req.body);
    res.json({ success: true, data: result });
  }

  async deleteHallazgo(req: Request, res: Response) {
    const result = await service.deleteHallazgo(Number(req.params.id));
    res.json({ success: true, data: result });
  }

  // ──────────── Notihumedal ────────────
  async listNotihumedal(req: Request, res: Response) {
    const { page, limit, search, autor, tag, fechaDesde, fechaHasta, visible, archivado } = req.query;
    const result = await service.listNotihumedal(
      Number(page) || 1,
      Number(limit) || 50,
      {
        search: search as string,
        autor: autor as string,
        tag: tag as string,
        fechaDesde: fechaDesde as string,
        fechaHasta: fechaHasta as string,
        visible: visible as string,
        archivado: archivado as string,
      },
    );
    res.json({ success: true, ...result });
  }

  async listNotihumedalPublic(req: Request, res: Response) {
    const { page, limit, search, tag } = req.query;
    const result = await service.listNotihumedal(
      Number(page) || 1,
      Number(limit) || 50,
      { search: search as string, tag: tag as string, publicOnly: true },
    );
    res.json({ success: true, ...result });
  }

  async getNotihumedal(req: Request, res: Response) {
    const result = await service.getNotihumedal(Number(req.params.id));
    res.json({ success: true, data: result });
  }

  async createNotihumedal(req: Request, res: Response) {
    const result = await service.createNotihumedal(req.body);
    res.status(201).json({ success: true, data: result });
  }

  async updateNotihumedal(req: Request, res: Response) {
    const result = await service.updateNotihumedal(Number(req.params.id), req.body);
    res.json({ success: true, data: result });
  }

  async deleteNotihumedal(req: Request, res: Response) {
    const result = await service.deleteNotihumedal(Number(req.params.id));
    res.json({ success: true, data: result });
  }

  // ──────────── Prospectos Noticias ────────────
  async listProspectosNoticias(req: Request, res: Response) {
    const { status, page, limit } = req.query;
    console.log('Listando prospectos noticias con status:', status, 'page:', page, 'limit:', limit);
    const result = await service.listProspectosNoticias(status as string, Number(page) || 1, Number(limit) || 50);
    res.json({ success: true, ...result });
  }

  async aprobarProspectoNoticia(req: Request, res: Response) {
    const result = await service.aprobarProspectoNoticia(Number(req.params.id), req.user!.id);
    res.json({ success: true, data: result });
  }

  async rechazarProspectoNoticia(req: Request, res: Response) {
    const result = await service.rechazarProspectoNoticia(Number(req.params.id), req.user!.id, req.body.notas);
    res.json({ success: true, data: result });
  }

  async runScraper(req: Request, res: Response) {
    const result = await service.runScraper();
    res.json({ success: true, data: result });
  }

  // ──────────── CMS Sections ────────────
  async getCmsSections(req: Request, res: Response) {
    const result = await service.getCmsSections(req.params.pageSlug);
    res.json({ success: true, ...result });
  }

  async saveCmsSection(req: Request, res: Response) {
    const result = await service.saveCmsSection(req.params.pageSlug, req.params.sectionKey, req.body.items, req.user!.id);
    res.json({ success: true, data: result });
  }

  // ──────────── Admin Users ────────────
  async listAdminUsers(req: Request, res: Response) {
    const result = await service.listAdminUsers(req.params.observatory);
    res.json({ success: true, ...result });
  }

  async createAdminUser(req: Request, res: Response) {
    const result = await service.createAdminUser(req.body, req.params.observatory);
    res.status(201).json({ success: true, data: result });
  }

  async updateAdminUser(req: Request, res: Response) {
    const result = await service.updateAdminUser(req.params.id, req.body);
    res.json({ success: true, data: result });
  }

  async deleteAdminUser(req: Request, res: Response) {
    const result = await service.deleteAdminUser(req.params.id);
    res.json({ success: true, data: result });
  }
}
