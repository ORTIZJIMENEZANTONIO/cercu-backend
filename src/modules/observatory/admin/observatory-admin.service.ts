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
import { ingestMongabayProspectos } from "./notihumedal-scraper.service";

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

  async listGreenRoofs(
    page = 1,
    limit = 50,
    filters: { search?: string; alcaldia?: string; tipoEdificio?: string; estado?: string; visible?: string; archivado?: string; publicOnly?: boolean } = {},
  ) {
    const qb = greenRoofRepo().createQueryBuilder("g");
    if (filters.publicOnly) {
      qb.andWhere("g.visible = :vis", { vis: true });
      qb.andWhere("g.archivado = :arch", { arch: false });
    }
    if (filters.search) qb.andWhere("g.nombre LIKE :search", { search: `%${filters.search}%` });
    if (filters.alcaldia) qb.andWhere("g.alcaldia = :alcaldia", { alcaldia: filters.alcaldia });
    if (filters.tipoEdificio) qb.andWhere("g.tipoEdificio = :tipoEdificio", { tipoEdificio: filters.tipoEdificio });
    if (filters.estado) qb.andWhere("g.estado = :estado", { estado: filters.estado });
    if (filters.visible === 'true') qb.andWhere("g.visible = :vis", { vis: true });
    if (filters.visible === 'false') qb.andWhere("g.visible = :vis", { vis: false });
    if (filters.archivado === 'true') qb.andWhere("g.archivado = :arch", { arch: true });
    if (filters.archivado === 'false') qb.andWhere("g.archivado = :arch", { arch: false });
    qb.orderBy("g.id", "DESC").skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
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

  async listCandidates(
    page = 1,
    limit = 50,
    filters: { search?: string; alcaldia?: string; tipoEdificio?: string; estatus?: string; visible?: string; archivado?: string; publicOnly?: boolean } = {},
  ) {
    const qb = candidateRepo().createQueryBuilder("c");
    if (filters.publicOnly) {
      qb.andWhere("c.visible = :vis", { vis: true });
      qb.andWhere("c.archivado = :arch", { arch: false });
    }
    if (filters.search) qb.andWhere("c.nombre LIKE :search", { search: `%${filters.search}%` });
    if (filters.alcaldia) qb.andWhere("c.alcaldia = :alcaldia", { alcaldia: filters.alcaldia });
    if (filters.tipoEdificio) qb.andWhere("c.tipoEdificio = :tipoEdificio", { tipoEdificio: filters.tipoEdificio });
    if (filters.estatus) qb.andWhere("c.estatus = :estatus", { estatus: filters.estatus });
    if (filters.visible === 'true') qb.andWhere("c.visible = :vis", { vis: true });
    if (filters.visible === 'false') qb.andWhere("c.visible = :vis", { vis: false });
    if (filters.archivado === 'true') qb.andWhere("c.archivado = :arch", { arch: true });
    if (filters.archivado === 'false') qb.andWhere("c.archivado = :arch", { arch: false });
    qb.orderBy("c.scoreAptitud", "DESC").skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
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

  async listValidations(
    page = 1,
    limit = 50,
    filters: { search?: string; estado?: string; confianza?: string; visible?: string; archivado?: string; publicOnly?: boolean } = {},
  ) {
    const qb = validationRepo().createQueryBuilder("v");
    if (filters.publicOnly) {
      qb.andWhere("v.visible = :vis", { vis: true });
      qb.andWhere("v.archivado = :arch", { arch: false });
    }
    if (filters.search) qb.andWhere("v.nombre LIKE :search", { search: `%${filters.search}%` });
    if (filters.estado) qb.andWhere("v.estado = :estado", { estado: filters.estado });
    if (filters.confianza) qb.andWhere("v.confianza = :confianza", { confianza: filters.confianza });
    if (filters.visible === 'true') qb.andWhere("v.visible = :vis", { vis: true });
    if (filters.visible === 'false') qb.andWhere("v.visible = :vis", { vis: false });
    if (filters.archivado === 'true') qb.andWhere("v.archivado = :arch", { arch: true });
    if (filters.archivado === 'false') qb.andWhere("v.archivado = :arch", { arch: false });
    qb.orderBy("v.id", "DESC").skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
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

  async listHumedales(
    page = 1,
    limit = 50,
    filters: { search?: string; alcaldia?: string; tipoHumedal?: string; estado?: string; visible?: string; archivado?: string; publicOnly?: boolean } = {},
  ) {
    const qb = humedalRepo().createQueryBuilder("h");

    if (filters.publicOnly) {
      qb.andWhere("h.visible = :vis", { vis: true });
      qb.andWhere("h.archivado = :arch", { arch: false });
    }
    if (filters.search) {
      qb.andWhere("h.nombre LIKE :search", { search: `%${filters.search}%` });
    }
    if (filters.alcaldia) {
      qb.andWhere("h.alcaldia = :alcaldia", { alcaldia: filters.alcaldia });
    }
    if (filters.tipoHumedal) {
      qb.andWhere("h.tipoHumedal = :tipoHumedal", { tipoHumedal: filters.tipoHumedal });
    }
    if (filters.estado) {
      qb.andWhere("h.estado = :estado", { estado: filters.estado });
    }
    if (filters.visible === 'true') qb.andWhere("h.visible = :vis", { vis: true });
    if (filters.visible === 'false') qb.andWhere("h.visible = :vis", { vis: false });
    if (filters.archivado === 'true') qb.andWhere("h.archivado = :arch", { arch: true });
    if (filters.archivado === 'false') qb.andWhere("h.archivado = :arch", { arch: false });

    qb.orderBy("h.id", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
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

  async listHallazgos(
    page = 1,
    limit = 50,
    filters: { visible?: string; archivado?: string; impacto?: string; publicOnly?: boolean } = {},
  ) {
    const qb = hallazgoRepo().createQueryBuilder("h");

    if (filters.publicOnly) {
      qb.andWhere("h.visible = :vis", { vis: true });
      qb.andWhere("h.archivado = :arch", { arch: false });
    }
    if (filters.impacto) {
      qb.andWhere("h.impacto = :impacto", { impacto: filters.impacto });
    }
    if (filters.visible === 'true') qb.andWhere("h.visible = :vis", { vis: true });
    if (filters.visible === 'false') qb.andWhere("h.visible = :vis", { vis: false });
    if (filters.archivado === 'true') qb.andWhere("h.archivado = :arch", { arch: true });
    if (filters.archivado === 'false') qb.andWhere("h.archivado = :arch", { arch: false });

    qb.orderBy("h.id", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
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

  async listNotihumedal(
    page = 1,
    limit = 50,
    filters: { search?: string; autor?: string; tag?: string; fechaDesde?: string; fechaHasta?: string; visible?: string; archivado?: string; publicOnly?: boolean } = {},
  ) {
    const qb = notiRepo().createQueryBuilder("n");

    if (filters.publicOnly) {
      qb.andWhere("n.visible = :vis", { vis: true });
      qb.andWhere("n.archivado = :arch", { arch: false });
    }
    if (filters.search) {
      qb.andWhere("n.titulo LIKE :search", { search: `%${filters.search}%` });
    }
    if (filters.autor) {
      qb.andWhere("n.autor = :autor", { autor: filters.autor });
    }
    if (filters.tag) {
      qb.andWhere("JSON_CONTAINS(n.tags, :tag)", { tag: JSON.stringify(filters.tag) });
    }
    if (filters.fechaDesde) {
      qb.andWhere("n.fecha >= :fechaDesde", { fechaDesde: filters.fechaDesde });
    }
    if (filters.fechaHasta) {
      qb.andWhere("n.fecha <= :fechaHasta", { fechaHasta: filters.fechaHasta });
    }
    if (filters.visible === 'true') qb.andWhere("n.visible = :vis", { vis: true });
    if (filters.visible === 'false') qb.andWhere("n.visible = :vis", { vis: false });
    if (filters.archivado === 'true') qb.andWhere("n.archivado = :arch", { arch: true });
    if (filters.archivado === 'false') qb.andWhere("n.archivado = :arch", { arch: false });

    qb.orderBy("n.fecha", "DESC")
      .addOrderBy("n.id", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
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
    // Scrapea https://es.mongabay.com/list/mexico/, filtra por keywords de
    // humedales/aguas, deduplica por hash de URL e inserta los nuevos como
    // prospectos `pendiente`. Idempotente: re-correr no duplica.
    const result = await ingestMongabayProspectos();
    return {
      message: result.inserted > 0
        ? `Scraper ejecutado: ${result.inserted} nuevo(s) prospecto(s).`
        : 'Scraper ejecutado: sin novedades (todo ya estaba en la cola).',
      source: 'mongabay-mexico',
      ...result,
    };
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

  async listAdminUsers(observatory: string, isSuperadmin = false) {
    const admins = await adminUserRepo().find({ order: { createdAt: "DESC" } });
    const filtered = isSuperadmin
      ? admins
      : admins.filter((a) => a.observatories.includes(observatory));
    return {
      items: filtered.map((a) => ({
        id: a.id,
        email: a.email,
        name: a.name,
        role: (a as any).role || "admin",
        permissions: (a as any).permissions || [],
        observatories: a.observatories || [],
        isActive: a.isActive,
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
      observatories?: string[];
      isActive?: boolean;
    },
    observatory: string,
    isSuperadmin = false
  ) {
    const bcrypt = require("bcryptjs");
    const existing = await adminUserRepo().findOne({
      where: { email: data.email },
    });
    if (existing) throw new AppError("Ya existe un usuario con ese email", 400);

    const role = data.role && ["superadmin", "admin", "editor"].includes(data.role)
      ? data.role
      : "admin";
    if (role === "superadmin" && !isSuperadmin) {
      throw new AppError("Sólo un superadmin puede crear otro superadmin", 403);
    }

    const observatories =
      isSuperadmin && Array.isArray(data.observatories) && data.observatories.length > 0
        ? data.observatories
        : [observatory];

    const admin = adminUserRepo().create({
      email: data.email,
      name: data.name,
      passwordHash: await bcrypt.hash(data.password, 12),
      observatories,
      role,
      permissions: Array.isArray(data.permissions) ? data.permissions : [],
      isActive: data.isActive ?? true,
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
      observatories: string[];
      isActive: boolean;
    }>,
    isSuperadmin = false
  ) {
    const admin = await adminUserRepo().findOne({ where: { id } });
    if (!admin) throw new AppError("Usuario no encontrado", 404);

    if (data.name !== undefined) admin.name = data.name;
    if (data.email !== undefined) admin.email = data.email;
    if (data.password) {
      const bcrypt = require("bcryptjs");
      admin.passwordHash = await bcrypt.hash(data.password, 12);
    }
    if (data.role !== undefined) {
      if (!["superadmin", "admin", "editor"].includes(data.role)) {
        throw new AppError("Rol inválido", 400);
      }
      const promotingToSuper = data.role === "superadmin" && admin.role !== "superadmin";
      const demotingFromSuper = admin.role === "superadmin" && data.role !== "superadmin";
      if ((promotingToSuper || demotingFromSuper) && !isSuperadmin) {
        throw new AppError("Sólo un superadmin puede cambiar el rol superadmin", 403);
      }
      if (demotingFromSuper) {
        const supers = await adminUserRepo().count({ where: { role: "superadmin" } });
        if (supers <= 1) {
          throw new AppError("No se puede degradar al último superadmin", 400);
        }
      }
      admin.role = data.role;
    }
    if (data.permissions !== undefined) admin.permissions = data.permissions;
    if (data.observatories !== undefined) {
      if (!isSuperadmin) {
        throw new AppError(
          "Sólo un superadmin puede modificar los observatorios asignados",
          403
        );
      }
      admin.observatories = data.observatories;
    }
    if (data.isActive !== undefined) {
      if (admin.role === "superadmin" && !data.isActive) {
        const activeSupers = await adminUserRepo().count({
          where: { role: "superadmin", isActive: true },
        });
        if (activeSupers <= 1) {
          throw new AppError("No se puede desactivar al último superadmin activo", 400);
        }
      }
      admin.isActive = data.isActive;
    }
    return adminUserRepo().save(admin);
  }

  async deleteAdminUser(id: string, currentUserId: string) {
    const admin = await adminUserRepo().findOne({ where: { id } });
    if (!admin) throw new AppError("Usuario no encontrado", 404);
    if (admin.id === currentUserId) {
      throw new AppError("No puedes eliminar tu propia cuenta", 400);
    }
    if (admin.role === "superadmin") {
      const supers = await adminUserRepo().count({ where: { role: "superadmin" } });
      if (supers <= 1) {
        throw new AppError("No se puede eliminar al último superadmin", 400);
      }
    }
    await adminUserRepo().remove(admin);
    return { deleted: true };
  }
}
