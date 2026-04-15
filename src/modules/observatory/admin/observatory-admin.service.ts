import { AppDataSource } from "../../../ormconfig";
import {
  ProspectSubmission,
  ProspectStatus,
} from "../../../entities/observatory/ProspectSubmission";
import { ObsGreenRoof } from "../../../entities/observatory/GreenRoof";
import { ObsCandidateRoof } from "../../../entities/observatory/CandidateRoof";
import { ObsValidationRecord } from "../../../entities/observatory/ValidationRecord";
import { ObsHumedal } from "../../../entities/observatory/Humedal";
import { ObsHallazgo } from "../../../entities/observatory/Hallazgo";
import { ObsNotihumedal } from "../../../entities/observatory/Notihumedal";
import { ObsProspectoNoticia } from "../../../entities/observatory/ProspectoNoticia";
import { ObsCmsSection } from "../../../entities/observatory/CmsSection";
import { ObservatoryAdmin } from "../../../entities/observatory/ObservatoryAdmin";
import { AppError } from "../../../middleware/errorHandler.middleware";
import * as crypto from "crypto";

const prospectRepo = () => AppDataSource.getRepository(ProspectSubmission);
const greenRoofRepo = () => AppDataSource.getRepository(ObsGreenRoof);
const candidateRepo = () => AppDataSource.getRepository(ObsCandidateRoof);
const validationRepo = () => AppDataSource.getRepository(ObsValidationRecord);
const humedalRepo = () => AppDataSource.getRepository(ObsHumedal);
const hallazgoRepo = () => AppDataSource.getRepository(ObsHallazgo);
const notiRepo = () => AppDataSource.getRepository(ObsNotihumedal);
const prospectoNoticiaRepo = () =>
  AppDataSource.getRepository(ObsProspectoNoticia);
const cmsSectionRepo = () => AppDataSource.getRepository(ObsCmsSection);
const adminUserRepo = () => AppDataSource.getRepository(ObservatoryAdmin);

export class ObservatoryAdminService {
  // ══════════════════════════════════════
  //  Summary
  // ══════════════════════════════════════

  async getSummary(observatory: string) {
    const pRepo = prospectRepo();
    const totalProspects = await pRepo.count({ where: { observatory } });
    const pendingProspects = await pRepo.count({
      where: { observatory, status: ProspectStatus.PENDIENTE },
    });
    const approvedProspects = await pRepo.count({
      where: { observatory, status: ProspectStatus.APROBADO },
    });
    const rejectedProspects = await pRepo.count({
      where: { observatory, status: ProspectStatus.RECHAZADO },
    });

    let contentCounts: Record<string, number> = {};
    if (observatory === "techos-verdes") {
      contentCounts = {
        greenRoofs: await greenRoofRepo().count(),
        candidates: await candidateRepo().count(),
        validations: await validationRepo().count(),
      };
    } else if (observatory === "humedales") {
      contentCounts = {
        humedales: await humedalRepo().count(),
        hallazgos: await hallazgoRepo().count(),
      };
    }

    return {
      observatory,
      contenido: contentCounts,
      prospectos: {
        total: totalProspects,
        pendientes: pendingProspects,
        aprobados: approvedProspects,
        rechazados: rejectedProspects,
      },
    };
  }

  // ══════════════════════════════════════
  //  Prospectos
  // ══════════════════════════════════════

  async listProspects(
    observatory: string,
    status?: string,
    page = 1,
    limit = 20
  ) {
    const where: any = { observatory };
    if (status) where.status = status;
    const [items, total] = await prospectRepo().findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, pagination: { page, limit, total } };
  }

  async getProspect(id: number) {
    const r = await prospectRepo().findOne({ where: { id } });
    if (!r) throw new AppError("Prospecto no encontrado", 404);
    return r;
  }

  async submitProspect(
    observatory: string,
    data: Record<string, any>,
    source: string,
    confianzaDetector?: string
  ) {
    return prospectRepo().save(
      prospectRepo().create({
        observatory,
        status: ProspectStatus.PENDIENTE,
        data,
        source,
        confianzaDetector: confianzaDetector || null,
      })
    );
  }

  async approveProspect(id: number, adminId: string) {
    const p = await prospectRepo().findOne({ where: { id } });
    if (!p) throw new AppError("Prospecto no encontrado", 404);
    if (p.status !== ProspectStatus.PENDIENTE)
      throw new AppError("Solo se pueden aprobar prospectos pendientes", 400);
    p.status = ProspectStatus.APROBADO;
    p.reviewedBy = adminId;
    p.reviewedAt = new Date();
    return prospectRepo().save(p);
  }

  async rejectProspect(id: number, adminId: string, notas: string) {
    const p = await prospectRepo().findOne({ where: { id } });
    if (!p) throw new AppError("Prospecto no encontrado", 404);
    if (p.status !== ProspectStatus.PENDIENTE)
      throw new AppError("Solo se pueden rechazar prospectos pendientes", 400);
    p.status = ProspectStatus.RECHAZADO;
    p.reviewedBy = adminId;
    p.reviewedAt = new Date();
    p.notasAdmin = notas;
    return prospectRepo().save(p);
  }

  // ══════════════════════════════════════
  //  Green Roofs (techos-verdes)
  // ══════════════════════════════════════

  async listGreenRoofs(page = 1, limit = 50) {
    const [items, total] = await greenRoofRepo().findAndCount({
      order: { id: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, pagination: { page, limit, total } };
  }

  async getGreenRoof(id: number) {
    const r = await greenRoofRepo().findOne({ where: { id } });
    if (!r) throw new AppError("Techo verde no encontrado", 404);
    return r;
  }

  async createGreenRoof(data: Partial<ObsGreenRoof>) {
    return greenRoofRepo().save(greenRoofRepo().create(data));
  }

  async updateGreenRoof(id: number, data: Partial<ObsGreenRoof>) {
    const r = await this.getGreenRoof(id);
    Object.assign(r, data);
    return greenRoofRepo().save(r);
  }

  async deleteGreenRoof(id: number) {
    const r = await this.getGreenRoof(id);
    await greenRoofRepo().remove(r);
    return { deleted: true };
  }

  // ══════════════════════════════════════
  //  Candidate Roofs (techos-verdes)
  // ══════════════════════════════════════

  async listCandidates(page = 1, limit = 50) {
    const [items, total] = await candidateRepo().findAndCount({
      order: { scoreAptitud: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, pagination: { page, limit, total } };
  }

  async getCandidate(id: number) {
    const r = await candidateRepo().findOne({ where: { id } });
    if (!r) throw new AppError("Candidato no encontrado", 404);
    return r;
  }

  async createCandidate(data: Partial<ObsCandidateRoof>) {
    return candidateRepo().save(candidateRepo().create(data));
  }

  async updateCandidate(id: number, data: Partial<ObsCandidateRoof>) {
    const r = await this.getCandidate(id);
    Object.assign(r, data);
    return candidateRepo().save(r);
  }

  async deleteCandidate(id: number) {
    const r = await this.getCandidate(id);
    await candidateRepo().remove(r);
    return { deleted: true };
  }

  // ══════════════════════════════════════
  //  Validation Records (techos-verdes)
  // ══════════════════════════════════════

  async listValidations(page = 1, limit = 50) {
    const [items, total] = await validationRepo().findAndCount({
      order: { id: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, pagination: { page, limit, total } };
  }

  async getValidation(id: number) {
    const r = await validationRepo().findOne({ where: { id } });
    if (!r) throw new AppError("Validacion no encontrada", 404);
    return r;
  }

  async createValidation(data: Partial<ObsValidationRecord>) {
    return validationRepo().save(validationRepo().create(data));
  }

  async updateValidation(id: number, data: Partial<ObsValidationRecord>) {
    const r = await this.getValidation(id);
    Object.assign(r, data);
    return validationRepo().save(r);
  }

  async deleteValidation(id: number) {
    const r = await this.getValidation(id);
    await validationRepo().remove(r);
    return { deleted: true };
  }

  // ══════════════════════════════════════
  //  Humedales
  // ══════════════════════════════════════

  async listHumedales(page = 1, limit = 50) {
    const [items, total] = await humedalRepo().findAndCount({
      order: { id: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, pagination: { page, limit, total } };
  }

  async getHumedal(id: number) {
    const r = await humedalRepo().findOne({ where: { id } });
    if (!r) throw new AppError("Humedal no encontrado", 404);
    return r;
  }

  async createHumedal(data: Partial<ObsHumedal>) {
    return humedalRepo().save(humedalRepo().create(data));
  }

  async updateHumedal(id: number, data: Partial<ObsHumedal>) {
    const r = await this.getHumedal(id);
    Object.assign(r, data);
    return humedalRepo().save(r);
  }

  async deleteHumedal(id: number) {
    const r = await this.getHumedal(id);
    await humedalRepo().remove(r);
    return { deleted: true };
  }

  // ══════════════════════════════════════
  //  Hallazgos
  // ══════════════════════════════════════

  async listHallazgos(page = 1, limit = 50) {
    const [items, total] = await hallazgoRepo().findAndCount({
      order: { id: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, pagination: { page, limit, total } };
  }

  async getHallazgo(id: number) {
    const r = await hallazgoRepo().findOne({ where: { id } });
    if (!r) throw new AppError("Hallazgo no encontrado", 404);
    return r;
  }

  async createHallazgo(data: Partial<ObsHallazgo>) {
    return hallazgoRepo().save(hallazgoRepo().create(data));
  }

  async updateHallazgo(id: number, data: Partial<ObsHallazgo>) {
    const r = await this.getHallazgo(id);
    Object.assign(r, data);
    return hallazgoRepo().save(r);
  }

  async deleteHallazgo(id: number) {
    const r = await this.getHallazgo(id);
    await hallazgoRepo().remove(r);
    return { deleted: true };
  }

  // ══════════════════════════════════════
  //  Notihumedal (Articles)
  // ══════════════════════════════════════

  async listNotihumedal(page = 1, limit = 50) {
    const [items, total] = await notiRepo().findAndCount({
      order: { id: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, pagination: { page, limit, total } };
  }

  async getNotihumedal(id: number) {
    const r = await notiRepo().findOne({ where: { id } });
    if (!r) throw new AppError("Articulo no encontrado", 404);
    return r;
  }

  async createNotihumedal(data: Partial<ObsNotihumedal>) {
    if (!data.slug && data.titulo) {
      data.slug = data.titulo
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }
    return notiRepo().save(notiRepo().create(data));
  }

  async updateNotihumedal(id: number, data: Partial<ObsNotihumedal>) {
    const r = await this.getNotihumedal(id);
    Object.assign(r, data);
    return notiRepo().save(r);
  }

  async deleteNotihumedal(id: number) {
    const r = await this.getNotihumedal(id);
    await notiRepo().remove(r);
    return { deleted: true };
  }

  // ══════════════════════════════════════
  //  Prospectos de Noticias (Scraping)
  // ══════════════════════════════════════

  async listProspectosNoticias(status?: string, page = 1, limit = 50) {
    const where: any = {};
    console.error("Filtering prospectos by status:", status);
    if (status) where.estado = status;
    const [items, total] = await prospectoNoticiaRepo().findAndCount({
      where,
      order: { id: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, pagination: { page, limit, total } };
  }

  async aprobarProspectoNoticia(id: number, adminId: string) {
    const r = await prospectoNoticiaRepo().findOne({ where: { id } });
    if (!r) throw new AppError("Prospecto no encontrado", 404);
    if (r.estado !== "pendiente")
      throw new AppError("Solo se pueden aprobar prospectos pendientes", 400);
    r.estado = "aprobado";
    r.reviewedBy = adminId;
    return prospectoNoticiaRepo().save(r);
  }

  async rechazarProspectoNoticia(id: number, adminId: string, notas: string) {
    const r = await prospectoNoticiaRepo().findOne({ where: { id } });
    if (!r) throw new AppError("Prospecto no encontrado", 404);
    if (r.estado !== "pendiente")
      throw new AppError("Solo se pueden rechazar prospectos pendientes", 400);
    r.estado = "rechazado";
    r.notasRechazo = notas;
    r.reviewedBy = adminId;
    return prospectoNoticiaRepo().save(r);
  }

  async runScraper() {
    // Placeholder: returns empty result. Real scraping runs via cron job.
    return { message: "Scraper ejecutado", nuevosProspectos: 0 };
  }

  // ══════════════════════════════════════
  //  CMS Sections
  // ══════════════════════════════════════

  async getCmsSections(pageSlug: string) {
    const sections = await cmsSectionRepo().find({ where: { pageSlug } });
    const result: Record<string, any[]> = {};
    for (const s of sections) result[s.sectionKey] = s.items;
    return { sections: result };
  }

  async saveCmsSection(
    pageSlug: string,
    sectionKey: string,
    items: any[],
    adminId: string
  ) {
    let section = await cmsSectionRepo().findOne({
      where: { pageSlug, sectionKey },
    });
    if (section) {
      section.items = items;
      section.updatedBy = adminId;
    } else {
      section = cmsSectionRepo().create({
        pageSlug,
        sectionKey,
        items,
        updatedBy: adminId,
      });
    }
    return cmsSectionRepo().save(section);
  }

  // ══════════════════════════════════════
  //  Admin Users
  // ══════════════════════════════════════

  async listAdminUsers(observatory: string) {
    const admins = await adminUserRepo().find({ order: { createdAt: "DESC" } });
    // Filter by observatory access
    return {
      items: admins
        .filter((a) => a.observatories.includes(observatory))
        .map((a) => ({
          id: a.id,
          email: a.email,
          name: a.name,
          role: (a as any).role || "admin",
          permissions: (a as any).permissions || [],
          createdAt: a.createdAt,
          lastLogin: (a as any).lastLogin || null,
        })),
    };
  }

  async createAdminUser(
    data: {
      email: string;
      name: string;
      password: string;
      role?: string;
      permissions?: string[];
    },
    observatory: string
  ) {
    const bcrypt = require("bcryptjs");
    const existing = await adminUserRepo().findOne({
      where: { email: data.email },
    });
    if (existing) throw new AppError("Ya existe un usuario con ese email", 400);
    const admin = adminUserRepo().create({
      email: data.email,
      name: data.name,
      passwordHash: await bcrypt.hash(data.password, 12),
      observatories: [observatory],
    });
    return adminUserRepo().save(admin);
  }

  async updateAdminUser(
    id: string,
    data: Partial<{
      name: string;
      email: string;
      password: string;
      role: string;
      permissions: string[];
    }>
  ) {
    const admin = await adminUserRepo().findOne({ where: { id } });
    if (!admin) throw new AppError("Usuario no encontrado", 404);
    if (data.name) admin.name = data.name;
    if (data.email) admin.email = data.email;
    if (data.password) {
      const bcrypt = require("bcryptjs");
      admin.passwordHash = await bcrypt.hash(data.password, 12);
    }
    return adminUserRepo().save(admin);
  }

  async deleteAdminUser(id: string) {
    const admin = await adminUserRepo().findOne({ where: { id } });
    if (!admin) throw new AppError("Usuario no encontrado", 404);
    await adminUserRepo().remove(admin);
    return { deleted: true };
  }
}
