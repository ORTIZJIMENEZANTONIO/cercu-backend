import { AppDataSource } from '../../ormconfig';
import { User, UserRole } from '../../entities/User';
import { ProfessionalProfile, OnboardingStatus } from '../../entities/ProfessionalProfile';
import { Lead, LeadStatus } from '../../entities/Lead';
import { Wallet } from '../../entities/Wallet';
import { WalletTransaction, TransactionType, TransactionReason } from '../../entities/WalletTransaction';
import { AdminAction, AdminActionType } from '../../entities/AdminAction';
import { AppError } from '../../middleware/errorHandler.middleware';
import { parsePagination, paginatedResult } from '../../utils/pagination';

export class AdminService {
  private userRepo = AppDataSource.getRepository(User);
  private profileRepo = AppDataSource.getRepository(ProfessionalProfile);
  private leadRepo = AppDataSource.getRepository(Lead);
  private walletRepo = AppDataSource.getRepository(Wallet);
  private txRepo = AppDataSource.getRepository(WalletTransaction);
  private actionRepo = AppDataSource.getRepository(AdminAction);

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
      .leftJoinAndSelect('l.category', 'c')
      .leftJoinAndSelect('l.user', 'u');

    if (query.status) qb.andWhere('l.status = :status', { status: query.status });
    if (query.categoryId) qb.andWhere('l.categoryId = :catId', { catId: query.categoryId });

    qb.orderBy('l.createdAt', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [leads, total] = await qb.getManyAndCount();
    return paginatedResult(leads, total, { page, limit });
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
}