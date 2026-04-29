import { AppDataSource } from '../../../ormconfig';
import { ObsReef } from '../../../entities/observatory/Reef';
import { ObsConflict } from '../../../entities/observatory/Conflict';
import { ObsContributor } from '../../../entities/observatory/Contributor';
import { ObsObservation } from '../../../entities/observatory/Observation';
import { ObsBleachingAlert } from '../../../entities/observatory/BleachingAlert';
import { AppError } from '../../../middleware/errorHandler.middleware';

const reefRepo = () => AppDataSource.getRepository(ObsReef);
const conflictRepo = () => AppDataSource.getRepository(ObsConflict);
const contributorRepo = () => AppDataSource.getRepository(ObsContributor);
const observationRepo = () => AppDataSource.getRepository(ObsObservation);
const alertRepo = () => AppDataSource.getRepository(ObsBleachingAlert);

type PageOpts = { page?: number; limit?: number };

export class ArrecifesService {
  // ──────────────────────────── Summary ────────────────────────────
  async getSummary() {
    const [reefs, conflicts, contributors] = await Promise.all([
      reefRepo().count(),
      conflictRepo().count(),
      contributorRepo().count(),
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

    const reefsByStatus = await reefRepo()
      .createQueryBuilder('r')
      .select('r.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('r.status')
      .getRawMany();

    return {
      observatory: 'arrecifes',
      content: { reefs, conflicts, contributors },
      observations: obs,
      reefsByStatus: reefsByStatus.reduce((acc: any, r: any) => ({ ...acc, [r.status]: Number(r.count) }), {}),
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
}
