import { AppDataSource } from '../../../ormconfig';
import { ObsTechosVerdesTier } from '../../../entities/observatory/TechosVerdesTier';
import { ObsTechosVerdesContributor } from '../../../entities/observatory/TechosVerdesContributor';
import { ProspectSubmission } from '../../../entities/observatory/ProspectSubmission';
import { AppError } from '../../../middleware/errorHandler.middleware';

const tierRepo = () => AppDataSource.getRepository(ObsTechosVerdesTier);
const contribRepo = () => AppDataSource.getRepository(ObsTechosVerdesContributor);
const prospectRepo = () => AppDataSource.getRepository(ProspectSubmission);

// ── Tiers ───────────────────────────────────────────────────────────────────

export async function listTiers(filters: { publicOnly?: boolean } = {}) {
  const qb = tierRepo().createQueryBuilder('t');
  if (filters.publicOnly) {
    qb.andWhere('t.visible = :vis', { vis: true });
    qb.andWhere('t.archived = :arch', { arch: false });
  }
  qb.orderBy('t.sortOrder', 'ASC').addOrderBy('t.minScore', 'ASC');
  const items = await qb.getMany();
  return { items };
}

export async function getTier(id: number) {
  const t = await tierRepo().findOne({ where: { id } });
  if (!t) throw new AppError('Tier no encontrado', 404);
  return t;
}

export async function createTier(data: Partial<ObsTechosVerdesTier>) {
  if (!data.slug) throw new AppError('slug es requerido', 400);
  if (!data.label) throw new AppError('label es requerido', 400);
  const exists = await tierRepo().findOne({ where: { slug: data.slug } });
  if (exists) throw new AppError(`Ya existe un tier con slug "${data.slug}"`, 409);
  return tierRepo().save(tierRepo().create(data));
}

export async function updateTier(id: number, data: Partial<ObsTechosVerdesTier>) {
  const t = await getTier(id);
  Object.assign(t, data);
  return tierRepo().save(t);
}

export async function deleteTier(id: number) {
  const t = await getTier(id);
  t.archived = true;
  t.visible = false;
  return tierRepo().save(t);
}

// ── Contributors ────────────────────────────────────────────────────────────

export async function listContributors(filters: {
  search?: string;
  role?: string;
  tier?: string;
  verified?: boolean;
  publicOnly?: boolean;
  limit?: number;
} = {}) {
  const qb = contribRepo().createQueryBuilder('c');
  if (filters.publicOnly) {
    qb.andWhere('c.visible = :vis', { vis: true });
    qb.andWhere('c.archived = :arch', { arch: false });
    qb.andWhere('c.publicProfile = :pub', { pub: true });
  }
  if (filters.search) {
    qb.andWhere('(c.displayName LIKE :s OR c.handle LIKE :s OR c.affiliation LIKE :s)', {
      s: `%${filters.search}%`,
    });
  }
  if (filters.role) qb.andWhere('c.role = :role', { role: filters.role });
  if (filters.tier) qb.andWhere('c.tier = :tier', { tier: filters.tier });
  if (typeof filters.verified === 'boolean') {
    qb.andWhere('c.verified = :v', { v: filters.verified });
  }
  qb.orderBy('c.reputationScore', 'DESC').addOrderBy('c.displayName', 'ASC');
  if (filters.limit) qb.take(filters.limit);
  const items = await qb.getMany();
  return { items };
}

export async function getContributor(id: number) {
  const c = await contribRepo().findOne({ where: { id } });
  if (!c) throw new AppError('Contribuyente no encontrado', 404);
  return c;
}

export async function createContributor(data: Partial<ObsTechosVerdesContributor>) {
  if (!data.displayName) throw new AppError('displayName es requerido', 400);
  if (!data.handle) throw new AppError('handle es requerido', 400);
  const exists = await contribRepo().findOne({ where: { handle: data.handle } });
  if (exists) throw new AppError(`Ya existe un contribuyente con handle "${data.handle}"`, 409);
  return contribRepo().save(contribRepo().create({
    joinedAt: new Date().toISOString().slice(0, 10),
    ...data,
  }));
}

export async function updateContributor(id: number, data: Partial<ObsTechosVerdesContributor>) {
  const c = await getContributor(id);
  Object.assign(c, data);
  return contribRepo().save(c);
}

export async function deleteContributor(id: number) {
  const c = await getContributor(id);
  c.archived = true;
  c.visible = false;
  return contribRepo().save(c);
}

// ── Atribucion: vincular prospectos a contribuyentes ────────────────────────

export async function attachContributorToProspect(prospectId: number, contributorId: number | null) {
  const p = await prospectRepo().findOne({ where: { id: prospectId } });
  if (!p) throw new AppError('Prospecto no encontrado', 404);
  if (contributorId !== null) {
    const c = await contribRepo().findOne({ where: { id: contributorId } });
    if (!c) throw new AppError('Contribuyente no encontrado', 404);
  }
  p.contributorId = contributorId;
  return prospectRepo().save(p);
}

export async function incrementContributorOnApproval(contributorId: number) {
  const c = await contribRepo().findOne({ where: { id: contributorId } });
  if (!c) return;
  c.validatedContributions = (c.validatedContributions || 0) + 1;
  c.reputationScore = c.validatedContributions * 10 - c.rejectedContributions * 2;
  const total = c.validatedContributions + c.rejectedContributions;
  c.acceptanceRate = total > 0 ? Number((c.validatedContributions / total).toFixed(3)) : 0;
  const tiers = await tierRepo()
    .createQueryBuilder('t')
    .where('t.archived = :arch', { arch: false })
    .orderBy('t.minScore', 'ASC')
    .getMany();
  for (const t of tiers) {
    if (
      c.reputationScore >= t.minScore &&
      (t.maxScore === null || c.reputationScore <= t.maxScore)
    ) {
      c.tier = t.slug;
    }
  }
  return contribRepo().save(c);
}

export async function incrementContributorOnRejection(contributorId: number) {
  const c = await contribRepo().findOne({ where: { id: contributorId } });
  if (!c) return;
  c.rejectedContributions = (c.rejectedContributions || 0) + 1;
  const total = c.validatedContributions + c.rejectedContributions;
  c.acceptanceRate = total > 0 ? Number((c.validatedContributions / total).toFixed(3)) : 0;
  return contribRepo().save(c);
}
