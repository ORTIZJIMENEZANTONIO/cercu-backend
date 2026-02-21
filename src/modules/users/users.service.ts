import { AppDataSource } from '../../ormconfig';
import { User, UserRole } from '../../entities/User';
import { Lead, LeadStatus } from '../../entities/Lead';
import { AppError } from '../../middleware/errorHandler.middleware';

export class UsersService {
  private userRepo = AppDataSource.getRepository(User);
  private leadRepo = AppDataSource.getRepository(Lead);

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['wallet'],
    });
    if (!user) throw new AppError('User not found', 404);

    return {
      id: user.id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      dateOfBirth: user.dateOfBirth,
      authProvider: user.authProvider,
      profilePicture: user.profilePicture,
      role: user.role,
      phoneVerified: user.phoneVerified,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(userId: string, data: { name?: string; email?: string; dateOfBirth?: string }) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    if (data.name) user.name = data.name;
    if (data.email) user.email = data.email;
    if (data.dateOfBirth) user.dateOfBirth = data.dateOfBirth;

    return this.userRepo.save(user);
  }

  async updateProfilePicture(userId: string, filePath: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    user.profilePicture = `/uploads/${filePath}`;
    await this.userRepo.save(user);

    return { profilePicture: user.profilePicture };
  }

  async upgradeToProRole(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    if (user.role === UserRole.PROFESSIONAL) {
      throw new AppError('User is already a professional', 400);
    }

    user.role = UserRole.PROFESSIONAL;
    return this.userRepo.save(user);
  }

  async getLeads(userId: string) {
    // Lightweight query: only select needed columns, avoid large sort buffers
    const leads = await this.leadRepo
      .createQueryBuilder('lead')
      .select([
        'lead.id',
        'lead.status',
        'lead.urgencyTier',
        'lead.description',
        'lead.address',
        'lead.createdAt',
        'lead.expiresAt',
        'lead.takenByProfessionalId',
        'cat.name',
        'pro.businessName',
        'proUser.name',
      ])
      .leftJoin('lead.category', 'cat')
      .leftJoin('lead.takenByProfessional', 'pro')
      .leftJoin('pro.user', 'proUser')
      .where('lead.userId = :userId', { userId })
      .andWhere('lead.status NOT IN (:...excluded)', {
        excluded: [LeadStatus.CANCELLED, LeadStatus.EXPIRED],
      })
      .orderBy('lead.createdAt', 'DESC')
      .take(20)
      .getMany();

    // Fetch chips in a separate lightweight query to avoid cross-join bloat
    const leadIds = leads.map((l) => l.id);
    let chipsMap: Record<number, string[]> = {};

    if (leadIds.length > 0) {
      const chips = await AppDataSource
        .createQueryBuilder()
        .select(['lc.leadId', 'cc.label'])
        .from('lead_chips', 'lc')
        .innerJoin('category_chips', 'cc', 'cc.id = lc.categoryChipId')
        .where('lc.leadId IN (:...leadIds)', { leadIds })
        .getRawMany();

      for (const row of chips) {
        const id = row.lc_leadId || row.leadId;
        if (!chipsMap[id]) chipsMap[id] = [];
        chipsMap[id].push(row.cc_label || row.label);
      }
    }

    return leads.map((lead) => ({
      id: lead.id,
      status: lead.status,
      categoryName: (lead as any).category?.name || null,
      urgencyTier: lead.urgencyTier,
      description: lead.description,
      address: lead.address,
      chips: chipsMap[lead.id] || [],
      createdAt: lead.createdAt,
      expiresAt: lead.expiresAt,
      professional: lead.takenByProfessional
        ? {
            name: lead.takenByProfessional.businessName || (lead.takenByProfessional as any).user?.name || null,
          }
        : null,
    }));
  }
}