import { AppDataSource } from '../../ormconfig';
import { User, UserRole } from '../../entities/User';
import { ProfessionalProfile, OnboardingStatus } from '../../entities/ProfessionalProfile';
import { Lead, LeadStatus } from '../../entities/Lead';
import { Wallet } from '../../entities/Wallet';
import { WalletTransaction, TransactionType, TransactionReason } from '../../entities/WalletTransaction';
import { AdminAction, AdminActionType } from '../../entities/AdminAction';
import { Category } from '../../entities/Category';
import { CategoryChip } from '../../entities/CategoryChip';
import { CategoryConditionalField } from '../../entities/CategoryConditionalField';
import { CategoryPricing } from '../../entities/CategoryPricing';
import { PendingProfileChange, ChangeStatus } from '../../entities/PendingProfileChange';
import { Plan } from '../../entities/Plan';
import { BoostType } from '../../entities/BoostType';
import { ProLevel } from '../../entities/ProLevel';
import { Achievement } from '../../entities/Achievement';
import { MissionTemplate } from '../../entities/MissionTemplate';
import { ConfigKV } from '../../entities/ConfigKV';
import { CreditLedger } from '../../entities/CreditLedger';
import { XPReason } from '../../entities/ProXPLog';
import { AppError } from '../../middleware/errorHandler.middleware';
import { parsePagination, paginatedResult } from '../../utils/pagination';

export class AdminService {
  private userRepo = AppDataSource.getRepository(User);
  private profileRepo = AppDataSource.getRepository(ProfessionalProfile);
  private leadRepo = AppDataSource.getRepository(Lead);
  private walletRepo = AppDataSource.getRepository(Wallet);
  private txRepo = AppDataSource.getRepository(WalletTransaction);
  private actionRepo = AppDataSource.getRepository(AdminAction);
  private categoryRepo = AppDataSource.getRepository(Category);
  private chipRepo = AppDataSource.getRepository(CategoryChip);
  private fieldRepo = AppDataSource.getRepository(CategoryConditionalField);
  private pricingRepo = AppDataSource.getRepository(CategoryPricing);
  private pendingChangeRepo = AppDataSource.getRepository(PendingProfileChange);
  private planAdminRepo = AppDataSource.getRepository(Plan);
  private boostTypeRepo = AppDataSource.getRepository(BoostType);
  private levelRepo = AppDataSource.getRepository(ProLevel);
  private achievementRepo = AppDataSource.getRepository(Achievement);
  private missionTemplateRepo = AppDataSource.getRepository(MissionTemplate);
  private configRepo = AppDataSource.getRepository(ConfigKV);
  private creditLedgerRepo = AppDataSource.getRepository(CreditLedger);

  // Users
  async listUsers(query: any) {
    const { page, limit } = parsePagination(query);
    const qb = this.userRepo.createQueryBuilder('u');

    if (query.role) qb.andWhere('u.role = :role', { role: query.role });
    if (query.search) {
      qb.andWhere('(u.phone LIKE :s OR u.name LIKE :s)', { s: `%${query.search}%` });
    }
    if (query.isActive !== undefined) {
      qb.andWhere('u.isActive = :active', { active: query.isActive === 'true' });
    }

    qb.orderBy('u.createdAt', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [users, total] = await qb.getManyAndCount();
    return paginatedResult(users, total, { page, limit });
  }

  async blockUser(adminId: string, targetUserId: string, reason: string) {
    const user = await this.userRepo.findOne({ where: { id: targetUserId } });
    if (!user) throw new AppError('User not found', 404);

    user.isActive = false;
    await this.userRepo.save(user);

    await this.logAction(adminId, AdminActionType.BLOCK_USER, targetUserId, null, reason);
    return user;
  }

  async unblockUser(adminId: string, targetUserId: string) {
    const user = await this.userRepo.findOne({ where: { id: targetUserId } });
    if (!user) throw new AppError('User not found', 404);

    user.isActive = true;
    await this.userRepo.save(user);

    await this.logAction(adminId, AdminActionType.UNBLOCK_USER, targetUserId, null, null);
    return user;
  }

  async updateUser(adminId: string, targetUserId: string, data: { name?: string; email?: string; dateOfBirth?: string; role?: string; phone?: string }) {
    const user = await this.userRepo.findOne({ where: { id: targetUserId } });
    if (!user) throw new AppError('User not found', 404);

    if (data.name !== undefined) user.name = data.name;
    if (data.email !== undefined) user.email = data.email;
    if (data.dateOfBirth !== undefined) user.dateOfBirth = data.dateOfBirth;
    if (data.phone !== undefined) user.phone = data.phone;
    if (data.role && Object.values(UserRole).includes(data.role as UserRole)) {
      user.role = data.role as UserRole;
    }

    await this.userRepo.save(user);
    await this.logAction(adminId, AdminActionType.BLOCK_USER, targetUserId, null, 'Updated user profile');
    return user;
  }

  async flagUser(adminId: string, targetUserId: string, reason: string) {
    const user = await this.userRepo.findOne({ where: { id: targetUserId } });
    if (!user) throw new AppError('User not found', 404);

    user.isFlagged = true;
    user.flagReason = reason;
    await this.userRepo.save(user);

    await this.logAction(adminId, AdminActionType.FLAG_USER, targetUserId, null, reason);
    return user;
  }

  // Professionals
  async listProfessionals(query: any) {
    const { page, limit } = parsePagination(query);
    const qb = this.profileRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.user', 'u')
      .leftJoinAndSelect('p.categories', 'pc')
      .leftJoinAndSelect('pc.category', 'c');

    if (query.status) {
      qb.andWhere('p.onboardingStatus = :status', { status: query.status });
    }

    qb.orderBy('p.createdAt', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [profiles, total] = await qb.getManyAndCount();
    return paginatedResult(profiles, total, { page, limit });
  }

  async approveProfessional(adminId: string, userId: string) {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) throw new AppError('Professional profile not found', 404);

    profile.onboardingStatus = OnboardingStatus.APPROVED;
    await this.profileRepo.save(profile);

    await this.logAction(adminId, AdminActionType.APPROVE_PROFESSIONAL, userId, null, null);
    return profile;
  }

  async rejectProfessional(adminId: string, userId: string, reason: string) {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) throw new AppError('Professional profile not found', 404);

    profile.onboardingStatus = OnboardingStatus.REJECTED;
    await this.profileRepo.save(profile);

    await this.logAction(adminId, AdminActionType.REJECT_PROFESSIONAL, userId, null, reason);
    return profile;
  }

  async suspendProfessional(adminId: string, userId: string, reason: string) {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) throw new AppError('Professional profile not found', 404);

    profile.isAvailable = false;
    await this.profileRepo.save(profile);

    await this.logAction(adminId, AdminActionType.SUSPEND_PROFESSIONAL, userId, null, reason);
    return profile;
  }

  // Leads
  async listLeads(query: any) {
    const { page, limit } = parsePagination(query);
    const qb = this.leadRepo.createQueryBuilder('l')
      .leftJoin('l.category', 'c')
      .addSelect(['c.id', 'c.name', 'c.slug', 'c.icon'])
      .leftJoin('l.user', 'u')
      .addSelect(['u.id', 'u.name', 'u.phone']);

    if (query.status) qb.andWhere('l.status = :status', { status: query.status });
    if (query.categoryId) qb.andWhere('l.categoryId = :catId', { catId: query.categoryId });

    qb.orderBy('l.createdAt', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [leads, total] = await qb.getManyAndCount();

    // Enrich leads with takenByProfile info
    const profileIds = leads
      .map(l => l.takenByProfessionalId)
      .filter((id): id is number => !!id);

    let profileMap: Record<number, any> = {};
    if (profileIds.length > 0) {
      const profiles = await this.profileRepo
        .createQueryBuilder('p')
        .leftJoin('p.user', 'pu')
        .addSelect(['pu.name', 'pu.phone'])
        .whereInIds(profileIds)
        .getMany();
      for (const p of profiles) {
        profileMap[p.id] = {
          id: p.id,
          businessName: p.businessName,
          user: { name: (p as any).user?.name, phone: (p as any).user?.phone },
        };
      }
    }

    const enrichedLeads = leads.map(lead => ({
      ...lead,
      takenByProfile: lead.takenByProfessionalId ? profileMap[lead.takenByProfessionalId] || null : null,
    }));

    return paginatedResult(enrichedLeads, total, { page, limit });
  }

  async cancelLead(adminId: string, leadId: number, reason: string) {
    const lead = await this.leadRepo.findOne({ where: { id: leadId } });
    if (!lead) throw new AppError('Lead not found', 404);

    lead.status = LeadStatus.CANCELLED;
    await this.leadRepo.save(lead);

    await this.logAction(adminId, AdminActionType.CANCEL_LEAD, null, leadId, reason);
    return lead;
  }

  async refundLead(adminId: string, leadId: number, reason: string) {
    const lead = await this.leadRepo.findOne({ where: { id: leadId } });
    if (!lead) throw new AppError('Lead not found', 404);

    if (!lead.takenByProfessionalId) {
      throw new AppError('Lead was not taken by any professional', 400);
    }

    // Find the pro's wallet and refund
    const profile = await this.profileRepo.findOne({
      where: { id: lead.takenByProfessionalId },
    });
    if (!profile) throw new AppError('Professional not found', 404);

    const wallet = await this.walletRepo.findOne({
      where: { userId: profile.userId },
    });
    if (!wallet) throw new AppError('Wallet not found', 404);

    const refundAmount = Number(lead.priceMXN);
    wallet.balance = Number(wallet.balance) + refundAmount;
    wallet.totalSpent = Number(wallet.totalSpent) - refundAmount;
    await this.walletRepo.save(wallet);

    await this.txRepo.save(
      this.txRepo.create({
        walletId: wallet.id,
        type: TransactionType.CREDIT,
        reason: TransactionReason.REFUND,
        amount: refundAmount,
        balanceAfter: wallet.balance,
        leadId,
        notes: `Admin refund: ${reason}`,
      })
    );

    lead.status = LeadStatus.CANCELLED;
    await this.leadRepo.save(lead);

    await this.logAction(adminId, AdminActionType.REFUND_LEAD, null, leadId, reason);
    return { lead, refundAmount };
  }

  // Wallet adjustments
  async adjustWallet(
    adminId: string,
    targetUserId: string,
    amount: number,
    reason: string
  ) {
    const wallet = await this.walletRepo.findOne({ where: { userId: targetUserId } });
    if (!wallet) throw new AppError('Wallet not found', 404);

    const type = amount >= 0 ? TransactionType.CREDIT : TransactionType.DEBIT;
    wallet.balance = Number(wallet.balance) + amount;

    if (wallet.balance < 0) {
      throw new AppError('Adjustment would result in negative balance', 400);
    }

    await this.walletRepo.save(wallet);

    await this.txRepo.save(
      this.txRepo.create({
        walletId: wallet.id,
        type,
        reason: TransactionReason.ADMIN_ADJUSTMENT,
        amount: Math.abs(amount),
        balanceAfter: wallet.balance,
        notes: `Admin: ${reason}`,
      })
    );

    await this.logAction(adminId, AdminActionType.WALLET_ADJUSTMENT, targetUserId, null, reason);
    return { balance: wallet.balance };
  }

  // Summary
  async getSummary() {
    const totalUsers = await this.userRepo.count();
    const totalProfessionals = await this.profileRepo.count();
    const totalLeads = await this.leadRepo.count();
    const pendingLeads = await this.leadRepo.count({ where: { status: LeadStatus.PENDING } });
    const completedLeads = await this.leadRepo.count({ where: { status: LeadStatus.COMPLETED } });
    const pendingApprovals = await this.profileRepo.count({
      where: { onboardingStatus: OnboardingStatus.COMPLETED },
    });

    return {
      totalUsers,
      totalProfessionals,
      totalLeads,
      pendingLeads,
      completedLeads,
      pendingApprovals,
    };
  }

  // ─── Categories CRUD ───────────────────────────────────────

  async listCategories() {
    return this.categoryRepo.find({
      relations: ['chips', 'conditionalFields', 'pricing'],
      order: { sortOrder: 'ASC' },
    });
  }

  async getCategory(id: number) {
    const cat = await this.categoryRepo.findOne({
      where: { id },
      relations: ['chips', 'conditionalFields', 'pricing'],
    });
    if (!cat) throw new AppError('Category not found', 404);
    return cat;
  }

  async createCategory(data: {
    name: string;
    slug: string;
    icon?: string;
    type?: string;
    sortOrder?: number;
  }) {
    const existing = await this.categoryRepo.findOne({ where: { slug: data.slug } });
    if (existing) throw new AppError('Category with this slug already exists', 409);

    const cat = this.categoryRepo.create({
      name: data.name,
      slug: data.slug,
      icon: data.icon || null,
      type: (data.type as any) || 'project',
      sortOrder: data.sortOrder ?? 0,
      isActive: true,
    });
    return this.categoryRepo.save(cat);
  }

  async updateCategory(id: number, data: {
    name?: string;
    slug?: string;
    icon?: string;
    type?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    const cat = await this.categoryRepo.findOne({ where: { id } });
    if (!cat) throw new AppError('Category not found', 404);

    if (data.slug && data.slug !== cat.slug) {
      const existing = await this.categoryRepo.findOne({ where: { slug: data.slug } });
      if (existing) throw new AppError('Slug already in use', 409);
    }

    if (data.name !== undefined) cat.name = data.name;
    if (data.slug !== undefined) cat.slug = data.slug;
    if (data.icon !== undefined) cat.icon = data.icon;
    if (data.type !== undefined) cat.type = data.type as any;
    if (data.sortOrder !== undefined) cat.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) cat.isActive = data.isActive;

    return this.categoryRepo.save(cat);
  }

  async deleteCategory(id: number) {
    const cat = await this.categoryRepo.findOne({ where: { id } });
    if (!cat) throw new AppError('Category not found', 404);

    // Check if there are active leads using this category
    const activeLeads = await this.leadRepo.count({
      where: { categoryId: id, status: LeadStatus.PENDING },
    });
    if (activeLeads > 0) {
      throw new AppError(`Cannot delete: ${activeLeads} pending leads use this category`, 400);
    }

    await this.categoryRepo.remove(cat);
    return { deleted: true };
  }

  // ─── Chips CRUD ───────────────────────────────────────────

  async addChip(categoryId: number, data: { label: string; slug: string; sortOrder?: number }) {
    const cat = await this.categoryRepo.findOne({ where: { id: categoryId } });
    if (!cat) throw new AppError('Category not found', 404);

    const chip = this.chipRepo.create({
      categoryId,
      label: data.label,
      slug: data.slug,
      sortOrder: data.sortOrder ?? 0,
    });
    return this.chipRepo.save(chip);
  }

  async updateChip(chipId: number, data: { label?: string; slug?: string; sortOrder?: number }) {
    const chip = await this.chipRepo.findOne({ where: { id: chipId } });
    if (!chip) throw new AppError('Chip not found', 404);

    if (data.label !== undefined) chip.label = data.label;
    if (data.slug !== undefined) chip.slug = data.slug;
    if (data.sortOrder !== undefined) chip.sortOrder = data.sortOrder;

    return this.chipRepo.save(chip);
  }

  async deleteChip(chipId: number) {
    const chip = await this.chipRepo.findOne({ where: { id: chipId } });
    if (!chip) throw new AppError('Chip not found', 404);
    await this.chipRepo.remove(chip);
    return { deleted: true };
  }

  // ─── Conditional Fields CRUD ──────────────────────────────

  async addField(categoryId: number, data: {
    fieldKey: string;
    label: string;
    fieldType: string;
    options?: string[];
    required?: boolean;
    showWhenChipSlugs?: string[];
  }) {
    const cat = await this.categoryRepo.findOne({ where: { id: categoryId } });
    if (!cat) throw new AppError('Category not found', 404);

    const field = this.fieldRepo.create({
      categoryId,
      fieldKey: data.fieldKey,
      label: data.label,
      fieldType: data.fieldType as any,
      options: data.options || null,
      required: data.required ?? false,
      showWhenChipSlugs: data.showWhenChipSlugs || null,
    });
    return this.fieldRepo.save(field);
  }

  async updateField(fieldId: number, data: {
    fieldKey?: string;
    label?: string;
    fieldType?: string;
    options?: string[];
    required?: boolean;
    showWhenChipSlugs?: string[];
  }) {
    const field = await this.fieldRepo.findOne({ where: { id: fieldId } });
    if (!field) throw new AppError('Field not found', 404);

    if (data.fieldKey !== undefined) field.fieldKey = data.fieldKey;
    if (data.label !== undefined) field.label = data.label;
    if (data.fieldType !== undefined) field.fieldType = data.fieldType as any;
    if (data.options !== undefined) field.options = data.options;
    if (data.required !== undefined) field.required = data.required;
    if (data.showWhenChipSlugs !== undefined) field.showWhenChipSlugs = data.showWhenChipSlugs;

    return this.fieldRepo.save(field);
  }

  async deleteField(fieldId: number) {
    const field = await this.fieldRepo.findOne({ where: { id: fieldId } });
    if (!field) throw new AppError('Field not found', 404);
    await this.fieldRepo.remove(field);
    return { deleted: true };
  }

  // ─── Pricing CRUD ─────────────────────────────────────────

  async setPricing(categoryId: number, data: {
    urgencyTier: string;
    priceMXN: number;
    qualifiedSurchargeMXN?: number;
  }) {
    const cat = await this.categoryRepo.findOne({ where: { id: categoryId } });
    if (!cat) throw new AppError('Category not found', 404);

    let pricing = await this.pricingRepo.findOne({
      where: { categoryId, urgencyTier: data.urgencyTier as any },
    });

    if (pricing) {
      pricing.priceMXN = data.priceMXN;
      if (data.qualifiedSurchargeMXN !== undefined) {
        pricing.qualifiedSurchargeMXN = data.qualifiedSurchargeMXN;
      }
    } else {
      pricing = this.pricingRepo.create({
        categoryId,
        urgencyTier: data.urgencyTier as any,
        priceMXN: data.priceMXN,
        qualifiedSurchargeMXN: data.qualifiedSurchargeMXN ?? 0,
      });
    }

    return this.pricingRepo.save(pricing);
  }

  async deletePricing(pricingId: number) {
    const pricing = await this.pricingRepo.findOne({ where: { id: pricingId } });
    if (!pricing) throw new AppError('Pricing not found', 404);
    await this.pricingRepo.remove(pricing);
    return { deleted: true };
  }

  // ─── Pending Profile Changes ────────────────────────────────

  async listPendingChanges() {
    return this.pendingChangeRepo.find({
      where: { status: ChangeStatus.PENDING },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async approveChange(adminId: string, changeId: number) {
    const change = await this.pendingChangeRepo.findOne({
      where: { id: changeId },
    });
    if (!change) throw new AppError('Change request not found', 404);
    if (change.status !== ChangeStatus.PENDING) {
      throw new AppError('Change request already processed', 400);
    }

    // Apply the change to the user
    const user = await this.userRepo.findOne({ where: { id: change.userId } });
    if (!user) throw new AppError('User not found', 404);

    if (change.fieldName === 'name') {
      user.name = change.requestedValue;
    } else if (change.fieldName === 'phone') {
      user.phone = change.requestedValue;
    }
    await this.userRepo.save(user);

    change.status = ChangeStatus.APPROVED;
    change.reviewedAt = new Date();
    await this.pendingChangeRepo.save(change);

    await this.logAction(adminId, AdminActionType.APPROVE_PROFESSIONAL, change.userId, null, `Approved ${change.fieldName} change`);

    return change;
  }

  async rejectChange(adminId: string, changeId: number, adminNotes?: string) {
    const change = await this.pendingChangeRepo.findOne({
      where: { id: changeId },
    });
    if (!change) throw new AppError('Change request not found', 404);
    if (change.status !== ChangeStatus.PENDING) {
      throw new AppError('Change request already processed', 400);
    }

    change.status = ChangeStatus.REJECTED;
    change.adminNotes = adminNotes || null;
    change.reviewedAt = new Date();
    await this.pendingChangeRepo.save(change);

    return change;
  }

  // ─── Plans CRUD ──────────────────────────────────────────

  async listAdminPlans() {
    return this.planAdminRepo.find({ order: { sortOrder: 'ASC' } });
  }

  async createPlan(adminId: string, data: Partial<Plan>) {
    const existing = await this.planAdminRepo.findOne({ where: { slug: data.slug } });
    if (existing) throw new AppError('Plan with this slug already exists', 409);

    const plan = this.planAdminRepo.create(data);
    const saved = await this.planAdminRepo.save(plan);
    await this.logAction(adminId, AdminActionType.CREATE_PLAN, null, null, `Created plan: ${data.name}`);
    return saved;
  }

  async updatePlan(adminId: string, id: number, data: Partial<Plan>) {
    const plan = await this.planAdminRepo.findOne({ where: { id } });
    if (!plan) throw new AppError('Plan not found', 404);

    Object.assign(plan, data);
    const saved = await this.planAdminRepo.save(plan);
    await this.logAction(adminId, AdminActionType.UPDATE_PLAN, null, null, `Updated plan: ${plan.name}`);
    return saved;
  }

  async deletePlan(adminId: string, id: number) {
    const plan = await this.planAdminRepo.findOne({ where: { id } });
    if (!plan) throw new AppError('Plan not found', 404);

    await this.planAdminRepo.remove(plan);
    await this.logAction(adminId, AdminActionType.DELETE_PLAN, null, null, `Deleted plan: ${plan.name}`);
    return { deleted: true };
  }

  // ─── Boost Types CRUD ──────────────────────────────────

  async listBoostTypes() {
    return this.boostTypeRepo.find({ order: { sortOrder: 'ASC' } });
  }

  async createBoostType(adminId: string, data: Partial<BoostType>) {
    const existing = await this.boostTypeRepo.findOne({ where: { slug: data.slug } });
    if (existing) throw new AppError('Boost type with this slug already exists', 409);

    const bt = this.boostTypeRepo.create(data);
    const saved = await this.boostTypeRepo.save(bt);
    await this.logAction(adminId, AdminActionType.CREATE_BOOST_TYPE, null, null, `Created boost type: ${data.name}`);
    return saved;
  }

  async updateBoostType(adminId: string, id: number, data: Partial<BoostType>) {
    const bt = await this.boostTypeRepo.findOne({ where: { id } });
    if (!bt) throw new AppError('Boost type not found', 404);

    Object.assign(bt, data);
    const saved = await this.boostTypeRepo.save(bt);
    await this.logAction(adminId, AdminActionType.UPDATE_BOOST_TYPE, null, null, `Updated boost type: ${bt.name}`);
    return saved;
  }

  async deleteBoostType(adminId: string, id: number) {
    const bt = await this.boostTypeRepo.findOne({ where: { id } });
    if (!bt) throw new AppError('Boost type not found', 404);

    await this.boostTypeRepo.remove(bt);
    await this.logAction(adminId, AdminActionType.DELETE_BOOST_TYPE, null, null, `Deleted boost type: ${bt.name}`);
    return { deleted: true };
  }

  // ─── Levels CRUD ────────────────────────────────────────

  async listLevels() {
    return this.levelRepo.find({ order: { level: 'ASC' } });
  }

  async createLevel(adminId: string, data: Partial<ProLevel>) {
    const existing = await this.levelRepo.findOne({ where: { level: data.level } });
    if (existing) throw new AppError('Level number already exists', 409);

    const lvl = this.levelRepo.create(data);
    const saved = await this.levelRepo.save(lvl);
    await this.logAction(adminId, AdminActionType.CREATE_LEVEL, null, null, `Created level: ${data.name}`);
    return saved;
  }

  async updateLevel(adminId: string, id: number, data: Partial<ProLevel>) {
    const lvl = await this.levelRepo.findOne({ where: { id } });
    if (!lvl) throw new AppError('Level not found', 404);

    const before = { ...lvl };
    Object.assign(lvl, data);
    const saved = await this.levelRepo.save(lvl);
    await this.logActionWithMeta(adminId, AdminActionType.UPDATE_LEVEL, null, null, `Updated level: ${lvl.name}`, { before, after: saved });
    return saved;
  }

  async deleteLevel(adminId: string, id: number) {
    const lvl = await this.levelRepo.findOne({ where: { id } });
    if (!lvl) throw new AppError('Level not found', 404);

    await this.levelRepo.remove(lvl);
    await this.logAction(adminId, AdminActionType.DELETE_LEVEL, null, null, `Deleted level: ${lvl.name}`);
    return { deleted: true };
  }

  // ─── Achievements CRUD ─────────────────────────────────

  async listAchievements() {
    return this.achievementRepo.find({ order: { sortOrder: 'ASC' } });
  }

  async createAchievement(adminId: string, data: Partial<Achievement>) {
    const existing = await this.achievementRepo.findOne({ where: { slug: data.slug } });
    if (existing) throw new AppError('Achievement with this slug already exists', 409);

    const ach = this.achievementRepo.create(data);
    const saved = await this.achievementRepo.save(ach);
    await this.logAction(adminId, AdminActionType.CREATE_ACHIEVEMENT, null, null, `Created achievement: ${data.name}`);
    return saved;
  }

  async updateAchievement(adminId: string, id: number, data: Partial<Achievement>) {
    const ach = await this.achievementRepo.findOne({ where: { id } });
    if (!ach) throw new AppError('Achievement not found', 404);

    const before = { ...ach };
    Object.assign(ach, data);
    const saved = await this.achievementRepo.save(ach);
    await this.logActionWithMeta(adminId, AdminActionType.UPDATE_ACHIEVEMENT, null, null, `Updated achievement: ${ach.name}`, { before, after: saved });
    return saved;
  }

  async deleteAchievement(adminId: string, id: number) {
    const ach = await this.achievementRepo.findOne({ where: { id } });
    if (!ach) throw new AppError('Achievement not found', 404);

    await this.achievementRepo.remove(ach);
    await this.logAction(adminId, AdminActionType.DELETE_ACHIEVEMENT, null, null, `Deleted achievement: ${ach.name}`);
    return { deleted: true };
  }

  // ─── Mission Templates CRUD ────────────────────────────

  async listMissionTemplates() {
    return this.missionTemplateRepo.find({ order: { id: 'ASC' } });
  }

  async createMissionTemplate(adminId: string, data: Partial<MissionTemplate>) {
    const existing = await this.missionTemplateRepo.findOne({ where: { slug: data.slug } });
    if (existing) throw new AppError('Mission template with this slug already exists', 409);

    const mt = this.missionTemplateRepo.create(data);
    const saved = await this.missionTemplateRepo.save(mt);
    await this.logAction(adminId, AdminActionType.CREATE_MISSION_TEMPLATE, null, null, `Created mission: ${data.name}`);
    return saved;
  }

  async updateMissionTemplate(adminId: string, id: number, data: Partial<MissionTemplate>) {
    const mt = await this.missionTemplateRepo.findOne({ where: { id } });
    if (!mt) throw new AppError('Mission template not found', 404);

    Object.assign(mt, data);
    const saved = await this.missionTemplateRepo.save(mt);
    await this.logAction(adminId, AdminActionType.UPDATE_MISSION_TEMPLATE, null, null, `Updated mission: ${mt.name}`);
    return saved;
  }

  async deleteMissionTemplate(adminId: string, id: number) {
    const mt = await this.missionTemplateRepo.findOne({ where: { id } });
    if (!mt) throw new AppError('Mission template not found', 404);

    await this.missionTemplateRepo.remove(mt);
    await this.logAction(adminId, AdminActionType.DELETE_MISSION_TEMPLATE, null, null, `Deleted mission: ${mt.name}`);
    return { deleted: true };
  }

  // ─── Config KV ──────────────────────────────────────────

  async listConfigKV() {
    return this.configRepo.find({ order: { key: 'ASC' } });
  }

  async getConfigKV(key: string) {
    const config = await this.configRepo.findOne({ where: { key } });
    if (!config) throw new AppError('Config key not found', 404);
    return config;
  }

  async setConfigKV(adminId: string, key: string, value: string, description?: string) {
    let config = await this.configRepo.findOne({ where: { key } });
    if (config) {
      config.value = value;
      if (description !== undefined) config.description = description;
    } else {
      config = this.configRepo.create({ key, value, description: description || null });
    }

    const saved = await this.configRepo.save(config);
    await this.logAction(adminId, AdminActionType.UPDATE_CONFIG_KV, null, null, `Updated config: ${key}`);
    return saved;
  }

  async deleteConfigKV(key: string) {
    const config = await this.configRepo.findOne({ where: { key } });
    if (!config) throw new AppError('Config key not found', 404);

    await this.configRepo.remove(config);
    return { deleted: true };
  }

  // ─── Audit Log ─────────────────────────────────────────

  async listAuditLogs(query: any) {
    const { page, limit } = parsePagination(query);
    const qb = this.actionRepo.createQueryBuilder('a')
      .leftJoinAndSelect('a.adminUser', 'admin')
      .orderBy('a.createdAt', 'DESC');

    if (query.actionType) {
      qb.andWhere('a.actionType = :actionType', { actionType: query.actionType });
    }
    if (query.adminUserId) {
      qb.andWhere('a.adminUserId = :adminUserId', { adminUserId: query.adminUserId });
    }
    if (query.from) {
      qb.andWhere('a.createdAt >= :from', { from: query.from });
    }
    if (query.to) {
      qb.andWhere('a.createdAt <= :to', { to: query.to });
    }

    qb.skip((page - 1) * limit).take(limit);
    const [logs, total] = await qb.getManyAndCount();
    return paginatedResult(logs, total, { page, limit });
  }

  // ─── Credit Ledger ─────────────────────────────────────

  async getCreditUsageThisMonth(userId: string): Promise<number> {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const result = await this.creditLedgerRepo
      .createQueryBuilder('cl')
      .select('COALESCE(SUM(cl.amount), 0)', 'total')
      .where('cl.userId = :userId', { userId })
      .andWhere('cl.monthKey = :monthKey', { monthKey })
      .getRawOne();
    return Number(result?.total || 0);
  }

  // ─── XP Grant ─────────────────────────────────────────

  async adminGrantXP(adminId: string, userId: string, amount: number, notes?: string) {
    const { GamificationService } = await import('../gamification/gamification.service');
    const gamService = new GamificationService();

    const result = await gamService.grantXP(userId, amount, XPReason.ADMIN_GRANT);
    await this.logAction(adminId, AdminActionType.GRANT_XP, userId, null, notes || `Granted ${amount} XP`);
    return result;
  }

  private async logAction(
    adminId: string,
    actionType: AdminActionType,
    targetUserId: string | null,
    targetLeadId: number | null,
    reason: string | null
  ) {
    await this.actionRepo.save(
      this.actionRepo.create({
        adminUserId: adminId,
        actionType,
        targetUserId,
        targetLeadId,
        reason,
      })
    );
  }

  private async logActionWithMeta(
    adminId: string,
    actionType: AdminActionType,
    targetUserId: string | null,
    targetLeadId: number | null,
    reason: string | null,
    metadata: Record<string, any>
  ) {
    await this.actionRepo.save(
      this.actionRepo.create({
        adminUserId: adminId,
        actionType,
        targetUserId,
        targetLeadId,
        reason,
        metadata,
      })
    );
  }
}