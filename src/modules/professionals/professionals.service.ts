import { AppDataSource } from '../../ormconfig';
import { User, UserRole } from '../../entities/User';
import { ProfessionalProfile, OnboardingStatus } from '../../entities/ProfessionalProfile';
import { ProfessionalCategory } from '../../entities/ProfessionalCategory';
import { ProfessionalScheduleSlot } from '../../entities/ProfessionalScheduleSlot';
import { Lead, LeadStatus } from '../../entities/Lead';
import { LeadMatch, MatchStatus } from '../../entities/LeadMatch';
import { Wallet } from '../../entities/Wallet';
import { WalletTransaction, TransactionType, TransactionReason } from '../../entities/WalletTransaction';
import { AppError } from '../../middleware/errorHandler.middleware';
import { haversineDistance } from '../../utils/haversine';

export class ProfessionalsService {
  private profileRepo = AppDataSource.getRepository(ProfessionalProfile);
  private proCategoryRepo = AppDataSource.getRepository(ProfessionalCategory);
  private scheduleRepo = AppDataSource.getRepository(ProfessionalScheduleSlot);
  private leadRepo = AppDataSource.getRepository(Lead);
  private matchRepo = AppDataSource.getRepository(LeadMatch);
  private walletRepo = AppDataSource.getRepository(Wallet);
  private txRepo = AppDataSource.getRepository(WalletTransaction);
  private userRepo = AppDataSource.getRepository(User);

  async onboard(userId: string, data: {
    businessName: string;
    description?: string;
    baseLat: number;
    baseLng: number;
    serviceRadiusKm?: number;
    categoryIds: number[];
    schedule: { dayOfWeek: number; startTime: string; endTime: string }[];
  }) {
    // Upgrade role if needed
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    if (user.role === UserRole.USER) {
      user.role = UserRole.PROFESSIONAL;
      await this.userRepo.save(user);
    }

    // Check for existing profile
    let profile = await this.profileRepo.findOne({ where: { userId } });
    if (profile) throw new AppError('Professional profile already exists', 400);

    profile = this.profileRepo.create({
      userId,
      businessName: data.businessName,
      description: data.description,
      baseLat: data.baseLat,
      baseLng: data.baseLng,
      serviceRadiusKm: data.serviceRadiusKm || 10,
      onboardingStatus: OnboardingStatus.COMPLETED,
    });
    profile = await this.profileRepo.save(profile);

    // Add categories
    for (const catId of data.categoryIds) {
      await this.proCategoryRepo.save(
        this.proCategoryRepo.create({
          professionalProfileId: profile.id,
          categoryId: catId,
        })
      );
    }

    // Add schedule
    for (const slot of data.schedule) {
      await this.scheduleRepo.save(
        this.scheduleRepo.create({
          professionalProfileId: profile.id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })
      );
    }

    return this.getProfile(userId);
  }

  async getProfile(userId: string) {
    const profile = await this.profileRepo.findOne({
      where: { userId },
      relations: ['categories', 'categories.category', 'scheduleSlots', 'user'],
    });

    if (!profile) throw new AppError('Professional profile not found', 404);
    return profile;
  }

  async updateProfile(userId: string, data: Partial<ProfessionalProfile>) {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) throw new AppError('Professional profile not found', 404);

    Object.assign(profile, data);
    return this.profileRepo.save(profile);
  }

  async updateCategories(userId: string, categoryIds: number[]) {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) throw new AppError('Professional profile not found', 404);

    await this.proCategoryRepo.delete({ professionalProfileId: profile.id });

    for (const catId of categoryIds) {
      await this.proCategoryRepo.save(
        this.proCategoryRepo.create({
          professionalProfileId: profile.id,
          categoryId: catId,
        })
      );
    }

    return this.getProfile(userId);
  }

  async updateSchedule(
    userId: string,
    schedule: { dayOfWeek: number; startTime: string; endTime: string }[]
  ) {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) throw new AppError('Professional profile not found', 404);

    await this.scheduleRepo.delete({ professionalProfileId: profile.id });

    for (const slot of schedule) {
      await this.scheduleRepo.save(
        this.scheduleRepo.create({
          professionalProfileId: profile.id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })
      );
    }

    return this.getProfile(userId);
  }

  async toggleAvailability(userId: string, isAvailable: boolean) {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) throw new AppError('Professional profile not found', 404);

    profile.isAvailable = isAvailable;
    return this.profileRepo.save(profile);
  }

  async getMatchedLeads(userId: string) {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) throw new AppError('Professional profile not found', 404);

    const matches = await this.matchRepo.find({
      where: { professionalProfileId: profile.id },
      relations: ['lead', 'lead.category', 'lead.chips', 'lead.chips.categoryChip'],
      order: { createdAt: 'DESC' },
    });

    return matches.map((m) => ({
      matchId: m.id,
      score: m.score,
      distanceKm: m.distanceKm,
      status: m.status,
      lead: {
        id: m.lead.id,
        categoryName: m.lead.category.name,
        categoryIcon: m.lead.category.icon,
        urgencyTier: m.lead.urgencyTier,
        status: m.lead.status,
        chips: m.lead.chips.map((c) => c.categoryChip?.label),
        priceMXN: m.lead.priceMXN,
        createdAt: m.lead.createdAt,
        // No contact info in preview
      },
    }));
  }

  async getLeadPreview(userId: string, leadId: number) {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) throw new AppError('Professional profile not found', 404);

    const match = await this.matchRepo.findOne({
      where: { professionalProfileId: profile.id, leadId },
      relations: [
        'lead', 'lead.category', 'lead.chips', 'lead.chips.categoryChip',
        'lead.conditionalFieldValues', 'lead.conditionalFieldValues.conditionalField',
      ],
    });

    if (!match) throw new AppError('Lead match not found', 404);

    // Mark as viewed
    if (match.status === MatchStatus.PENDING || match.status === MatchStatus.NOTIFIED) {
      match.status = MatchStatus.VIEWED;
      await this.matchRepo.save(match);
    }

    const lead = match.lead;
    return {
      matchId: match.id,
      score: match.score,
      distanceKm: match.distanceKm,
      lead: {
        id: lead.id,
        categoryName: lead.category.name,
        urgencyTier: lead.urgencyTier,
        description: lead.description,
        chips: lead.chips.map((c) => c.categoryChip?.label),
        conditionalFields: lead.conditionalFieldValues.map((v) => ({
          label: v.conditionalField?.label,
          value: v.value,
        })),
        photos: lead.photos,
        priceMXN: lead.priceMXN,
        // No exact location or contact info — only revealed after taking
        approximateArea: 'Zona cercana a tu ubicacion',
        createdAt: lead.createdAt,
      },
    };
  }

  async takeLead(userId: string, leadId: number) {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) throw new AppError('Professional profile not found', 404);

    if (profile.onboardingStatus !== OnboardingStatus.COMPLETED &&
        profile.onboardingStatus !== OnboardingStatus.APPROVED) {
      throw new AppError('Profile onboarding not complete', 400);
    }

    const match = await this.matchRepo.findOne({
      where: { professionalProfileId: profile.id, leadId },
      relations: ['lead', 'lead.user'],
    });

    if (!match) throw new AppError('Lead match not found', 404);

    const lead = match.lead;
    if (lead.status !== LeadStatus.PENDING && lead.status !== LeadStatus.MATCHED) {
      throw new AppError('Lead is no longer available', 400);
    }

    // Check wallet balance
    const wallet = await this.walletRepo.findOne({ where: { userId } });
    if (!wallet) throw new AppError('Wallet not found', 404);

    const price = Number(lead.priceMXN);
    if (Number(wallet.balance) < price) {
      throw new AppError('Insufficient wallet balance', 400);
    }

    if (wallet.isFrozen) {
      throw new AppError('Wallet is frozen', 400);
    }

    // Debit wallet
    wallet.balance = Number(wallet.balance) - price;
    wallet.totalSpent = Number(wallet.totalSpent) + price;
    await this.walletRepo.save(wallet);

    // Record transaction
    await this.txRepo.save(
      this.txRepo.create({
        walletId: wallet.id,
        type: TransactionType.DEBIT,
        reason: TransactionReason.LEAD_PURCHASE,
        amount: price,
        balanceAfter: wallet.balance,
        leadId: lead.id,
      })
    );

    // Update lead
    lead.status = LeadStatus.TAKEN;
    lead.takenByProfessionalId = profile.id;
    lead.takenAt = new Date();
    await this.leadRepo.save(lead);

    // Update match
    match.status = MatchStatus.TAKEN;
    await this.matchRepo.save(match);

    // Decline other matches
    await this.matchRepo
      .createQueryBuilder()
      .update(LeadMatch)
      .set({ status: MatchStatus.EXPIRED })
      .where('leadId = :leadId AND id != :matchId', {
        leadId: lead.id,
        matchId: match.id,
      })
      .execute();

    // Return full contact info now
    return {
      lead: {
        id: lead.id,
        description: lead.description,
        lat: lead.lat,
        lng: lead.lng,
        address: lead.address,
        photos: lead.photos,
        priceMXN: lead.priceMXN,
        user: {
          name: lead.user.name,
          phone: lead.user.phone,
        },
      },
      walletBalance: wallet.balance,
    };
  }

  async declineLead(userId: string, leadId: number) {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) throw new AppError('Professional profile not found', 404);

    const match = await this.matchRepo.findOne({
      where: { professionalProfileId: profile.id, leadId },
    });

    if (!match) throw new AppError('Lead match not found', 404);

    match.status = MatchStatus.DECLINED;
    await this.matchRepo.save(match);

    return { message: 'Lead declined' };
  }

  async getPublicProfile(profileId: number) {
    const profile = await this.profileRepo.findOne({
      where: { id: profileId },
      relations: ['user', 'categories', 'categories.category'],
    });

    if (!profile) throw new AppError('Professional not found', 404);

    return {
      id: profile.id,
      businessName: profile.businessName,
      description: profile.description,
      rating: profile.rating,
      completedJobs: profile.completedJobs,
      avgResponseTimeMinutes: profile.avgResponseTimeMinutes,
      badges: profile.badges,
      categories: profile.categories.map((c) => ({
        id: c.category.id,
        name: c.category.name,
        icon: c.category.icon,
      })),
      isAvailable: profile.isAvailable,
    };
  }
}