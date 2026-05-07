import fs from 'fs/promises';
import path from 'path';
import { AppDataSource } from '../../../ormconfig';
import { ObsReef } from '../../../entities/observatory/Reef';
import { ObsConflict } from '../../../entities/observatory/Conflict';
import { ObsContributor } from '../../../entities/observatory/Contributor';
import { ObsObservation } from '../../../entities/observatory/Observation';
import { ObsBleachingAlert } from '../../../entities/observatory/BleachingAlert';
import { ObsLayer } from '../../../entities/observatory/Layer';
import { ObsTier } from '../../../entities/observatory/Tier';
import { ObsReefMetricSnapshot } from '../../../entities/observatory/ReefMetricSnapshot';
import { ObsReefNews } from '../../../entities/observatory/ReefNews';
import { ObsReefNewsProspect } from '../../../entities/observatory/ReefNewsProspect';
import { AppError } from '../../../middleware/errorHandler.middleware';
import { fetchReefClimate } from './nasaPower.service';
import { computeCoralHealthIndex } from './coralHealthIndex';
import { ingestReefNewsProspectos } from './reefNews-scraper.service';

const reefRepo = () => AppDataSource.getRepository(ObsReef);
const conflictRepo = () => AppDataSource.getRepository(ObsConflict);
const contributorRepo = () => AppDataSource.getRepository(ObsContributor);
const observationRepo = () => AppDataSource.getRepository(ObsObservation);
const alertRepo = () => AppDataSource.getRepository(ObsBleachingAlert);
const layerRepo = () => AppDataSource.getRepository(ObsLayer);
const tierRepo = () => AppDataSource.getRepository(ObsTier);
const snapshotRepo = () => AppDataSource.getRepository(ObsReefMetricSnapshot);
const reefNewsRepo = () => AppDataSource.getRepository(ObsReefNews);
const reefNewsProspectRepo = () => AppDataSource.getRepository(ObsReefNewsProspect);

const UPLOADS_ROOT = path.join(__dirname, '../../../../uploads');

type PageOpts = { page?: number; limit?: number };

export class ArrecifesService {
  // ──────────────────────────── Summary ────────────────────────────
  // Cuenta dos cosas distintas:
  //  - `totals.X`  → todas las filas en la tabla (incluye archived/oculto).
  //  - `content.X` → "públicas": visible IS NULL o true, archived IS NULL o false.
  //    NULL-safe porque filas creadas antes de añadir las columnas tienen NULL ahí.
  // Todos los counts se coercen con Number() — en algunas combinaciones de TypeORM +
  // mysql2 `count()` devuelve string y eso reventaba a `value: 0` en el frontend.
  async getSummary() {
    const publicCount = (entity: any, alias: string) =>
      AppDataSource.getRepository(entity)
        .createQueryBuilder(alias)
        .where(`(${alias}.visible IS NULL OR ${alias}.visible = :vis)`, { vis: true })
        .andWhere(`(${alias}.archived IS NULL OR ${alias}.archived = :arch)`, { arch: false })
        .getCount();

    const [
      reefsTotal,
      reefsPublic,
      conflictsTotal,
      conflictsPublic,
      contributorsTotal,
      contributorsPublic,
    ] = await Promise.all([
      reefRepo().count(),
      publicCount(ObsReef, 'r'),
      conflictRepo().count(),
      publicCount(ObsConflict, 'c'),
      contributorRepo().count(),
      publicCount(ObsContributor, 'c'),
    ]);

    const observationsByStatus = await observationRepo()
      .createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('o.status')
      .getRawMany();

    const obs = { pending: 0, in_review: 0, validated: 0, rejected: 0, needs_more_info: 0 };
    for (const row of observationsByStatus) {
      (obs as any)[row.status] = Number(row.count);
    }

    const reefsByStatusRows = await reefRepo()
      .createQueryBuilder('r')
      .select('r.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('r.status')
      .getRawMany();

    const n = (v: unknown) => Number(v) || 0;

    return {
      observatory: 'arrecifes',
      content: {
        reefs: n(reefsPublic),
        conflicts: n(conflictsPublic),
        contributors: n(contributorsPublic),
      },
      totals: {
        reefs: n(reefsTotal),
        conflicts: n(conflictsTotal),
        contributors: n(contributorsTotal),
      },
      observations: obs,
      reefsByStatus: reefsByStatusRows.reduce(
        (acc: any, r: any) => ({ ...acc, [r.status]: Number(r.count) }),
        {},
      ),
    };
  }

  // ──────────────────────────── Reefs ────────────────────────────
  async listReefs(
    { page = 1, limit = 50 }: PageOpts,
    filters: { search?: string; state?: string; ocean?: string; status?: string; protection?: string; visible?: string; archived?: string; publicOnly?: boolean } = {},
  ) {
    const qb = reefRepo().createQueryBuilder('r');
    if (filters.publicOnly) {
      qb.andWhere('r.visible = :vis', { vis: true });
      qb.andWhere('r.archived = :arch', { arch: false });
    }
    if (filters.search) qb.andWhere('r.name LIKE :search', { search: `%${filters.search}%` });
    if (filters.state) qb.andWhere('r.state = :state', { state: filters.state });
    if (filters.ocean) qb.andWhere('r.ocean = :ocean', { ocean: filters.ocean });
    if (filters.status) qb.andWhere('r.status = :status', { status: filters.status });
    if (filters.protection) qb.andWhere('r.protection = :protection', { protection: filters.protection });
    if (filters.visible === 'true') qb.andWhere('r.visible = :vis', { vis: true });
    if (filters.visible === 'false') qb.andWhere('r.visible = :vis', { vis: false });
    if (filters.archived === 'true') qb.andWhere('r.archived = :arch', { arch: true });
    if (filters.archived === 'false') qb.andWhere('r.archived = :arch', { arch: false });
    qb.orderBy('r.id', 'ASC').skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items, pagination: { page, limit, total } };
  }

  async getReef(id: number) {
    const r = await reefRepo().findOne({ where: { id } });
    if (!r) throw new AppError('Arrecife no encontrado', 404);
    return r;
  }

  async createReef(data: Partial<ObsReef>) {
    return reefRepo().save(reefRepo().create(data));
  }

  async updateReef(id: number, data: Partial<ObsReef>) {
    const r = await this.getReef(id);
    Object.assign(r, data);
    return reefRepo().save(r);
  }

  async deleteReef(id: number) {
    const r = await this.getReef(id);
    await reefRepo().remove(r);
    return { deleted: true };
  }

  // ─────────────── NASA POWER (climatología) ───────────────
  // Refresca la climatología de un arrecife. Idempotente: re-llamarlo simplemente
  // sobreescribe `climateData` con los valores más recientes de NASA POWER.
  async refreshReefClimate(id: number) {
    const r = await this.getReef(id);
    const lat = Number(r.lat);
    const lng = Number(r.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new AppError('Arrecife sin coordenadas válidas', 400);
    }
    const data = await fetchReefClimate(lat, lng);
    r.climateData = data;
    r.climateFetchedAt = new Date();
    await reefRepo().save(r);
    return { id: r.id, climateData: r.climateData, climateFetchedAt: r.climateFetchedAt };
  }

  // Refresca todos los arrecifes secuencialmente con pequeño delay para no
  // saturar la API de NASA POWER (rate-limit blando ~10 req/s, vamos por debajo).
  async refreshAllReefClimate() {
    const reefs = await reefRepo().find({ select: ['id', 'name', 'lat', 'lng'] });
    const results: { id: number; name: string; ok: boolean; error?: string }[] = [];
    for (const r of reefs) {
      try {
        await this.refreshReefClimate(r.id);
        results.push({ id: r.id, name: r.name, ok: true });
      } catch (e: any) {
        results.push({ id: r.id, name: r.name, ok: false, error: e?.message || 'unknown' });
      }
      await new Promise((res) => setTimeout(res, 350));
    }
    return {
      total: reefs.length,
      ok: results.filter((x) => x.ok).length,
      failed: results.filter((x) => !x.ok).length,
      results,
    };
  }

  // ─────────────── Reef metric snapshots (serie de tiempo) ───────────────
  // Captura el estado actual de los 12 arrecifes y lo persiste como una fila
  // por reef. Idempotente para una misma fecha: si ya existe un snapshot del
  // día para un reef, se actualiza en lugar de crear duplicado.
  async snapshotAllReefs(source: 'manual' | 'cron' | 'seed' = 'manual') {
    const reefs = await reefRepo().find();
    if (reefs.length === 0) return { count: 0, capturedAt: null };

    // Última alerta por reef (la más reciente por observedAt) — N+1 evitado vía
    // un solo query y mapeo en memoria.
    const allAlerts = await alertRepo().find({ order: { observedAt: 'DESC' } });
    const latestByReef = new Map<number, ObsBleachingAlert>();
    for (const a of allAlerts) {
      if (!latestByReef.has(a.reefId)) latestByReef.set(a.reefId, a);
    }

    const today = new Date().toISOString().slice(0, 10);
    const rows: ObsReefMetricSnapshot[] = [];

    for (const r of reefs) {
      const alert = latestByReef.get(r.id) || null;
      const chi = computeCoralHealthIndex({
        liveCoralCover: r.liveCoralCover != null ? Number(r.liveCoralCover) : null,
        dhw: alert ? Number(alert.dhw) : null,
        protection: r.protection,
        threats: r.threats,
        speciesRichness: r.speciesRichness,
      });

      // Upsert por (reefId, capturedAt)
      const existing = await snapshotRepo().findOne({
        where: { reefId: r.id, capturedAt: today },
      });
      const payload: Partial<ObsReefMetricSnapshot> = {
        reefId: r.id,
        capturedAt: today,
        liveCoralCover: r.liveCoralCover != null ? Number(r.liveCoralCover) : null,
        dhw: alert && alert.dhw != null ? Number(alert.dhw) : null,
        sst: alert && alert.sst != null ? Number(alert.sst) : null,
        sstAnomaly: alert && alert.sstAnomaly != null ? Number(alert.sstAnomaly) : null,
        observationsCount: r.observations || 0,
        healthIndex: Math.round(chi * 100) / 100,
        source,
      };
      if (existing) {
        Object.assign(existing, payload);
        rows.push(await snapshotRepo().save(existing));
      } else {
        rows.push(await snapshotRepo().save(snapshotRepo().create(payload)));
      }
    }

    return { count: rows.length, capturedAt: today, source };
  }

  // Serie de tiempo de un solo arrecife. `days` opcional limita la ventana.
  async listReefMetrics(reefId: number, days?: number) {
    const qb = snapshotRepo()
      .createQueryBuilder('s')
      .where('s.reefId = :reefId', { reefId })
      .orderBy('s.capturedAt', 'ASC');
    if (days && days > 0) {
      const since = new Date();
      since.setDate(since.getDate() - days);
      qb.andWhere('s.capturedAt >= :since', { since: since.toISOString().slice(0, 10) });
    }
    return qb.getMany();
  }

  // Bulk: todos los reefs en una sola llamada — alimenta el panel de tendencias
  // sin tener que hacer 12 round-trips.
  async listAllReefMetrics(days?: number) {
    const qb = snapshotRepo()
      .createQueryBuilder('s')
      .orderBy('s.reefId', 'ASC')
      .addOrderBy('s.capturedAt', 'ASC');
    if (days && days > 0) {
      const since = new Date();
      since.setDate(since.getDate() - days);
      qb.where('s.capturedAt >= :since', { since: since.toISOString().slice(0, 10) });
    }
    return qb.getMany();
  }

  // ──────────────────────────── Conflicts ────────────────────────────
  async listConflicts(
    { page = 1, limit = 50 }: PageOpts,
    filters: { search?: string; state?: string; intensity?: string; status?: string; visible?: string; archived?: string; publicOnly?: boolean } = {},
  ) {
    const qb = conflictRepo().createQueryBuilder('c');
    if (filters.publicOnly) {
      qb.andWhere('c.visible = :vis', { vis: true });
      qb.andWhere('c.archived = :arch', { arch: false });
    }
    if (filters.search) qb.andWhere('c.title LIKE :search', { search: `%${filters.search}%` });
    if (filters.state) qb.andWhere('c.state = :state', { state: filters.state });
    if (filters.intensity) qb.andWhere('c.intensity = :intensity', { intensity: filters.intensity });
    if (filters.status) qb.andWhere('c.status = :status', { status: filters.status });
    if (filters.visible === 'true') qb.andWhere('c.visible = :vis', { vis: true });
    if (filters.visible === 'false') qb.andWhere('c.visible = :vis', { vis: false });
    if (filters.archived === 'true') qb.andWhere('c.archived = :arch', { arch: true });
    if (filters.archived === 'false') qb.andWhere('c.archived = :arch', { arch: false });
    qb.orderBy('c.updatedAt', 'DESC').skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items, pagination: { page, limit, total } };
  }

  async getConflict(id: number) {
    const r = await conflictRepo().findOne({ where: { id } });
    if (!r) throw new AppError('Conflicto no encontrado', 404);
    return r;
  }

  async createConflict(data: Partial<ObsConflict>) {
    return conflictRepo().save(conflictRepo().create(data));
  }

  async updateConflict(id: number, data: Partial<ObsConflict>) {
    const r = await this.getConflict(id);
    Object.assign(r, data);
    return conflictRepo().save(r);
  }

  async deleteConflict(id: number) {
    const r = await this.getConflict(id);
    await conflictRepo().remove(r);
    return { deleted: true };
  }

  // ──────────────────────────── Contributors ────────────────────────────
  async listContributors(
    { page = 1, limit = 50 }: PageOpts,
    filters: { search?: string; role?: string; tier?: string; verified?: string; visible?: string; archived?: string; publicOnly?: boolean } = {},
  ) {
    const qb = contributorRepo().createQueryBuilder('c');
    if (filters.publicOnly) {
      qb.andWhere('c.visible = :vis', { vis: true });
      qb.andWhere('c.archived = :arch', { arch: false });
      qb.andWhere('c.publicProfile = :pp', { pp: true });
    }
    if (filters.search) qb.andWhere('(c.displayName LIKE :search OR c.handle LIKE :search)', { search: `%${filters.search}%` });
    if (filters.role) qb.andWhere('c.role = :role', { role: filters.role });
    if (filters.tier) qb.andWhere('c.tier = :tier', { tier: filters.tier });
    if (filters.verified === 'true') qb.andWhere('c.verified = :v', { v: true });
    if (filters.verified === 'false') qb.andWhere('c.verified = :v', { v: false });
    if (filters.visible === 'true') qb.andWhere('c.visible = :vis', { vis: true });
    if (filters.visible === 'false') qb.andWhere('c.visible = :vis', { vis: false });
    if (filters.archived === 'true') qb.andWhere('c.archived = :arch', { arch: true });
    if (filters.archived === 'false') qb.andWhere('c.archived = :arch', { arch: false });
    qb.orderBy('c.reputationScore', 'DESC').skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items, pagination: { page, limit, total } };
  }

  async getContributor(id: number) {
    const r = await contributorRepo().findOne({ where: { id } });
    if (!r) throw new AppError('Colaborador no encontrado', 404);
    return r;
  }

  async createContributor(data: Partial<ObsContributor>) {
    const existing = await contributorRepo().findOne({ where: { handle: data.handle as string } });
    if (existing) throw new AppError('Handle ya existe', 400);
    return contributorRepo().save(contributorRepo().create(data));
  }

  async updateContributor(id: number, data: Partial<ObsContributor>) {
    const r = await this.getContributor(id);
    Object.assign(r, data);
    return contributorRepo().save(r);
  }

  async deleteContributor(id: number) {
    const r = await this.getContributor(id);
    await contributorRepo().remove(r);
    return { deleted: true };
  }

  // ──────────────────────────── Observations ────────────────────────────
  async listObservations(
    { page = 1, limit = 50 }: PageOpts,
    filters: { search?: string; reefId?: number; type?: string; status?: string; contributorId?: number; visible?: string; archived?: string; publicOnly?: boolean } = {},
  ) {
    const qb = observationRepo().createQueryBuilder('o');
    if (filters.publicOnly) {
      qb.andWhere('o.visible = :vis', { vis: true });
      qb.andWhere('o.archived = :arch', { arch: false });
      qb.andWhere('o.status = :st', { st: 'validated' });
    }
    if (filters.search) qb.andWhere('o.title LIKE :search', { search: `%${filters.search}%` });
    if (filters.reefId) qb.andWhere('o.reefId = :rid', { rid: filters.reefId });
    if (filters.type) qb.andWhere('o.type = :t', { t: filters.type });
    if (filters.status) qb.andWhere('o.status = :s', { s: filters.status });
    if (filters.contributorId) qb.andWhere('o.contributorId = :cid', { cid: filters.contributorId });
    if (filters.visible === 'true') qb.andWhere('o.visible = :vis', { vis: true });
    if (filters.visible === 'false') qb.andWhere('o.visible = :vis', { vis: false });
    if (filters.archived === 'true') qb.andWhere('o.archived = :arch', { arch: true });
    if (filters.archived === 'false') qb.andWhere('o.archived = :arch', { arch: false });
    qb.orderBy('o.submittedAt', 'DESC').skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items, pagination: { page, limit, total } };
  }

  async getObservation(id: number) {
    const r = await observationRepo().findOne({ where: { id } });
    if (!r) throw new AppError('Observacion no encontrada', 404);
    return r;
  }

  async submitObservation(data: any) {
    const obs = observationRepo().create({
      ...data,
      status: 'pending',
      submittedAt: new Date(),
      capturedAt: data.capturedAt ? new Date(data.capturedAt) : new Date(),
    });
    return observationRepo().save(obs);
  }

  async reviewObservation(
    id: number,
    reviewerId: string,
    payload: { status: string; reviewerNotes?: string; qualityScore?: number },
  ) {
    const r = await this.getObservation(id);
    r.status = payload.status;
    r.reviewerId = reviewerId;
    if (payload.reviewerNotes !== undefined) r.reviewerNotes = payload.reviewerNotes;
    if (payload.qualityScore !== undefined) r.qualityScore = payload.qualityScore;
    if (payload.status === 'validated') r.validatedAt = new Date();
    const saved = await observationRepo().save(r);

    // Update contributor counters
    if (payload.status === 'validated' || payload.status === 'rejected') {
      const contributor = await contributorRepo().findOne({ where: { id: r.contributorId } });
      if (contributor) {
        if (payload.status === 'validated') contributor.validatedContributions++;
        if (payload.status === 'rejected') contributor.rejectedContributions++;
        const totalReviewed = contributor.validatedContributions + contributor.rejectedContributions;
        contributor.acceptanceRate = totalReviewed > 0 ? contributor.validatedContributions / totalReviewed : 0;
        if (payload.qualityScore !== undefined && payload.status === 'validated') {
          const prev = Number(contributor.averageQuality) * (contributor.validatedContributions - 1);
          contributor.averageQuality = (prev + payload.qualityScore) / contributor.validatedContributions;
        }
        await contributorRepo().save(contributor);
      }
      // Bump observation count on reef
      if (payload.status === 'validated' && r.reefId) {
        await reefRepo().increment({ id: r.reefId }, 'observations', 1);
      }
    }

    return saved;
  }

  async deleteObservation(id: number) {
    const r = await this.getObservation(id);
    await observationRepo().remove(r);
    return { deleted: true };
  }

  // ──────────────────────────── Bleaching Alerts ────────────────────────────
  async listAlerts(filters: { reefId?: number; level?: string; latestPerReef?: boolean } = {}) {
    if (filters.latestPerReef) {
      const sub = alertRepo()
        .createQueryBuilder('a2')
        .select('MAX(a2.id)', 'maxId')
        .groupBy('a2.reefId');

      const items = await alertRepo()
        .createQueryBuilder('a')
        .where(`a.id IN (${sub.getQuery()})`)
        .orderBy('a.observedAt', 'DESC')
        .getMany();
      return { items };
    }

    const qb = alertRepo().createQueryBuilder('a');
    if (filters.reefId) qb.andWhere('a.reefId = :rid', { rid: filters.reefId });
    if (filters.level) qb.andWhere('a.level = :l', { l: filters.level });
    qb.orderBy('a.observedAt', 'DESC').take(200);
    const items = await qb.getMany();
    return { items };
  }

  async createAlert(data: any) {
    const alert = alertRepo().create({
      ...data,
      observedAt: new Date(data.observedAt),
    });
    const saved = await alertRepo().save(alert);
    // Sync bleachingAlert + status on the reef
    const reef = await reefRepo().findOne({ where: { id: data.reefId } });
    if (reef) {
      reef.bleachingAlert = data.level;
      if (data.level === 'alert_2') reef.status = 'mortality';
      else if (data.level === 'alert_1') reef.status = 'bleaching';
      else if (data.level === 'warning') reef.status = 'warning';
      else if (data.level === 'watch') reef.status = 'watch';
      await reefRepo().save(reef);
    }
    return saved;
  }

  // ──────────────────────────── Layers ────────────────────────────
  async listLayers(
    { page = 1, limit = 100 }: PageOpts,
    filters: {
      search?: string;
      provider?: string;
      category?: string;
      kind?: string;
      active?: string;
      visible?: string;
      archived?: string;
      publicOnly?: boolean;
    } = {},
  ) {
    const qb = layerRepo().createQueryBuilder('l');
    if (filters.publicOnly) {
      qb.andWhere('l.visible = :vis', { vis: true });
      qb.andWhere('l.archived = :arch', { arch: false });
    }
    if (filters.search)
      qb.andWhere('(l.title LIKE :search OR l.slug LIKE :search)', { search: `%${filters.search}%` });
    if (filters.provider) qb.andWhere('l.provider = :provider', { provider: filters.provider });
    if (filters.category) qb.andWhere('l.category = :category', { category: filters.category });
    if (filters.kind) qb.andWhere('l.kind = :kind', { kind: filters.kind });
    if (filters.active === 'true') qb.andWhere('l.active = :a', { a: true });
    if (filters.active === 'false') qb.andWhere('l.active = :a', { a: false });
    if (filters.visible === 'true') qb.andWhere('l.visible = :vis', { vis: true });
    if (filters.visible === 'false') qb.andWhere('l.visible = :vis', { vis: false });
    if (filters.archived === 'true') qb.andWhere('l.archived = :arch', { arch: true });
    if (filters.archived === 'false') qb.andWhere('l.archived = :arch', { arch: false });
    qb.orderBy('l.sortOrder', 'ASC').addOrderBy('l.id', 'ASC').skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items, pagination: { page, limit, total } };
  }

  async getLayer(idOrSlug: number | string) {
    const where = typeof idOrSlug === 'number' ? { id: idOrSlug } : { slug: idOrSlug };
    const r = await layerRepo().findOne({ where });
    if (!r) throw new AppError('Capa no encontrada', 404);
    return r;
  }

  async createLayer(data: Partial<ObsLayer>) {
    const slug = (data.slug || '').trim().toLowerCase();
    if (!slug) throw new AppError('slug requerido', 400);
    const existing = await layerRepo().findOne({ where: { slug } });
    if (existing) throw new AppError('Slug ya existe', 400);
    return layerRepo().save(layerRepo().create({ ...data, slug }));
  }

  async updateLayer(id: number, data: Partial<ObsLayer>) {
    const r = await this.getLayer(id);
    // Si cambia slug, validar unicidad.
    if (data.slug && data.slug !== r.slug) {
      const dup = await layerRepo().findOne({ where: { slug: data.slug } });
      if (dup) throw new AppError('Slug ya existe', 400);
    }
    Object.assign(r, data);
    return layerRepo().save(r);
  }

  async attachLayerFile(
    id: number,
    file: { filename: string; originalname: string; size: number; mimetype: string; path: string },
  ) {
    const layer = await this.getLayer(id);
    // Si había un archivo previo subido, intentamos borrarlo silenciosamente.
    if (layer.kind === 'uploaded_file' && layer.filePath) {
      const prev = path.join(UPLOADS_ROOT, layer.filePath);
      await fs.unlink(prev).catch(() => undefined);
    }
    layer.kind = 'uploaded_file';
    layer.fileName = file.originalname;
    layer.filePath = path.posix.join('layers', file.filename);
    layer.fileSize = file.size;
    layer.mimeType = file.mimetype;
    return layerRepo().save(layer);
  }

  async deleteLayer(id: number) {
    const r = await this.getLayer(id);
    if (r.kind === 'uploaded_file' && r.filePath) {
      const abs = path.join(UPLOADS_ROOT, r.filePath);
      await fs.unlink(abs).catch(() => undefined);
    }
    await layerRepo().remove(r);
    return { deleted: true };
  }

  // ──────────────────────────── Tiers ────────────────────────────
  async listTiers(filters: { visible?: string; archived?: string; publicOnly?: boolean } = {}) {
    const qb = tierRepo().createQueryBuilder('t');
    if (filters.publicOnly) {
      qb.andWhere('t.visible = :vis', { vis: true });
      qb.andWhere('t.archived = :arch', { arch: false });
    }
    if (filters.visible === 'true') qb.andWhere('t.visible = :vis', { vis: true });
    if (filters.visible === 'false') qb.andWhere('t.visible = :vis', { vis: false });
    if (filters.archived === 'true') qb.andWhere('t.archived = :arch', { arch: true });
    if (filters.archived === 'false') qb.andWhere('t.archived = :arch', { arch: false });
    qb.orderBy('t.sortOrder', 'ASC').addOrderBy('t.minScore', 'ASC');
    const items = await qb.getMany();
    return { items };
  }

  async getTier(idOrSlug: number | string) {
    const where = typeof idOrSlug === 'number' ? { id: idOrSlug } : { slug: idOrSlug };
    const t = await tierRepo().findOne({ where });
    if (!t) throw new AppError('Escala no encontrada', 404);
    return t;
  }

  async createTier(data: Partial<ObsTier>) {
    const slug = (data.slug || '').trim().toLowerCase();
    if (!slug) throw new AppError('slug requerido', 400);
    const existing = await tierRepo().findOne({ where: { slug } });
    if (existing) throw new AppError('Slug ya existe', 400);
    return tierRepo().save(tierRepo().create({ ...data, slug }));
  }

  async updateTier(id: number, data: Partial<ObsTier>) {
    const t = await this.getTier(id);
    if (data.slug && data.slug !== t.slug) {
      const dup = await tierRepo().findOne({ where: { slug: data.slug } });
      if (dup) throw new AppError('Slug ya existe', 400);
    }
    Object.assign(t, data);
    return tierRepo().save(t);
  }

  async deleteTier(id: number) {
    const t = await this.getTier(id);
    // Si hay colaboradores con este slug, no permitimos borrado físico.
    const inUse = await contributorRepo().count({ where: { tier: t.slug } });
    if (inUse > 0) {
      throw new AppError(
        `No se puede eliminar: ${inUse} colaborador${inUse === 1 ? '' : 'es'} usa${inUse === 1 ? '' : 'n'} esta escala. Archívala en su lugar.`,
        400,
      );
    }
    await tierRepo().remove(t);
    return { deleted: true };
  }

  // Devuelve la ruta absoluta del binario subido para descarga directa,
  // o la URL externa para redirect 302. Lanza 404 si la capa no es descargable.
  async resolveLayerDownload(id: number): Promise<{ kind: 'file'; absPath: string; fileName: string; mimeType: string }
    | { kind: 'redirect'; url: string }
  > {
    const layer = await this.getLayer(id);
    if (layer.archived || !layer.visible) throw new AppError('Capa no disponible', 404);

    if (layer.kind === 'uploaded_file' && layer.filePath) {
      return {
        kind: 'file',
        absPath: path.join(UPLOADS_ROOT, layer.filePath),
        fileName: layer.fileName || path.basename(layer.filePath),
        mimeType: layer.mimeType || 'application/octet-stream',
      };
    }
    const ext = layer.downloadUrl || layer.sourceUrl;
    if (!ext) throw new AppError('La capa no tiene URL de descarga', 404);
    return { kind: 'redirect', url: ext };
  }

  // ────────────────────── Reef News (artículos editoriales) ──────────────────────
  // Genera slug desde el título; añade sufijo numérico si choca.
  private async generateReefNewsSlug(title: string, excludeId?: number): Promise<string> {
    const base =
      title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 80) || 'articulo';
    let slug = base;
    let suffix = 1;
    while (true) {
      const existing = await reefNewsRepo().findOne({ where: { slug } });
      if (!existing || existing.id === excludeId) break;
      suffix++;
      slug = `${base}-${suffix}`;
    }
    return slug;
  }

  async listReefNews(
    { page = 1, limit = 50 }: PageOpts,
    filters: { search?: string; tag?: string; visible?: boolean; archived?: boolean; publicOnly?: boolean } = {},
  ) {
    const qb = reefNewsRepo().createQueryBuilder('n');
    if (filters.publicOnly) {
      qb.andWhere('(n.visible IS NULL OR n.visible = 1)');
      qb.andWhere('(n.archived IS NULL OR n.archived = 0)');
    } else {
      if (filters.visible !== undefined) qb.andWhere('n.visible = :v', { v: filters.visible });
      if (filters.archived !== undefined) qb.andWhere('n.archived = :a', { a: filters.archived });
    }
    if (filters.search) {
      qb.andWhere('(n.title LIKE :s OR n.summary LIKE :s)', { s: `%${filters.search}%` });
    }
    if (filters.tag) {
      qb.andWhere(`JSON_CONTAINS(n.tags, JSON_QUOTE(:tag))`, { tag: filters.tag });
    }
    qb.orderBy('n.publishedAt', 'DESC').addOrderBy('n.id', 'DESC');
    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items, pagination: { page, limit, total } };
  }

  async getReefNews(idOrSlug: number | string) {
    const where = typeof idOrSlug === 'number' ? { id: idOrSlug } : { slug: idOrSlug };
    const r = await reefNewsRepo().findOne({ where });
    if (!r) throw new AppError('Artículo no encontrado', 404);
    return r;
  }

  async createReefNews(data: Partial<ObsReefNews>) {
    if (!data.title) throw new AppError('Falta título', 400);
    const slug = data.slug || (await this.generateReefNewsSlug(data.title));
    return reefNewsRepo().save(reefNewsRepo().create({ ...data, slug }));
  }

  async updateReefNews(id: number, data: Partial<ObsReefNews>) {
    const r = (await this.getReefNews(id)) as ObsReefNews;
    if (data.title && data.title !== r.title && !data.slug) {
      data.slug = await this.generateReefNewsSlug(data.title, id);
    }
    Object.assign(r, data);
    return reefNewsRepo().save(r);
  }

  async deleteReefNews(id: number) {
    const r = (await this.getReefNews(id)) as ObsReefNews;
    await reefNewsRepo().remove(r);
    return { deleted: true };
  }

  // ─── Prospects (cola scraper) ───
  async listReefNewsProspects(status?: string, page = 1, limit = 50) {
    const where: any = {};
    if (status) where.status = status;
    const [items, total] = await reefNewsProspectRepo().findAndCount({
      where,
      order: { id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, pagination: { page, limit, total } };
  }

  async approveReefNewsProspect(id: number, adminId: string) {
    const p = await reefNewsProspectRepo().findOne({ where: { id } });
    if (!p) throw new AppError('Prospecto no encontrado', 404);
    if (p.status !== 'pending') {
      throw new AppError('Sólo se pueden aprobar prospectos pendientes', 400);
    }
    p.status = 'approved';
    p.reviewedBy = adminId;
    return reefNewsProspectRepo().save(p);
  }

  async rejectReefNewsProspect(id: number, adminId: string, notes: string) {
    const p = await reefNewsProspectRepo().findOne({ where: { id } });
    if (!p) throw new AppError('Prospecto no encontrado', 404);
    if (p.status !== 'pending') {
      throw new AppError('Sólo se pueden rechazar prospectos pendientes', 400);
    }
    p.status = 'rejected';
    p.rejectionNotes = notes;
    p.reviewedBy = adminId;
    return reefNewsProspectRepo().save(p);
  }

  async runReefNewsScraper() {
    const result = await ingestReefNewsProspectos();
    return {
      message: result.inserted > 0
        ? `Scraper ejecutado: ${result.inserted} nuevo(s) prospecto(s).`
        : 'Scraper ejecutado: sin novedades (todo ya estaba en la cola).',
      source: 'mongabay-mexico',
      ...result,
    };
  }
}
