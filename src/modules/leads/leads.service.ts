import { AppDataSource } from '../../ormconfig';
import { Lead, LeadStatus } from '../../entities/Lead';
import { LeadChip } from '../../entities/LeadChip';
import { LeadConditionalFieldValue } from '../../entities/LeadConditionalFieldValue';
import { CategoryPricing, UrgencyTier } from '../../entities/CategoryPricing';
import { AppError } from '../../middleware/errorHandler.middleware';
import { MatchingService } from './matching.service';
import { parsePagination, paginatedResult } from '../../utils/pagination';
import { haversineDistance } from '../../utils/haversine';

const matchingService = new MatchingService();

export class LeadsService {
  private leadRepo = AppDataSource.getRepository(Lead);
  private chipRepo = AppDataSource.getRepository(LeadChip);
  private fieldValueRepo = AppDataSource.getRepository(LeadConditionalFieldValue);
  private pricingRepo = AppDataSource.getRepository(CategoryPricing);

  async create(userId: string, data: {
    categoryId: number;
    urgencyTier: UrgencyTier;
    description?: string;
    lat: number;
    lng: number;
    address?: string;
    photos?: string[];
    chipIds: number[];
    conditionalFields?: { fieldId: number; value: string }[];
    preferredSchedule?: string;
  }) {
    // Anti-spam: max 3 leads in 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await this.leadRepo
      .createQueryBuilder('l')
      .where('l.userId = :userId', { userId })
      .andWhere('l.createdAt > :oneDayAgo', { oneDayAgo })
      .getCount();

    if (recentCount >= 3) {
      throw new AppError('Maximum 3 service requests per 24 hours', 429);
    }

    // Anti-spam: duplicate check (same category, within 150m, in 6h)
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const recentLeads = await this.leadRepo
      .createQueryBuilder('l')
      .where('l.userId = :userId', { userId })
      .andWhere('l.categoryId = :catId', { catId: data.categoryId })
      .andWhere('l.createdAt > :sixHoursAgo', { sixHoursAgo })
      .andWhere('l.status NOT IN (:...statuses)', {
        statuses: [LeadStatus.CANCELLED, LeadStatus.EXPIRED],
      })
      .getMany();

    for (const recent of recentLeads) {
      const dist = haversineDistance(
        data.lat, data.lng,
        Number(recent.lat), Number(recent.lng)
      );
      if (dist <= 0.15) {
        throw new AppError(
          'A similar request was already made nearby. Please wait or cancel the previous one.',
          400
        );
      }
    }

    // Get pricing
    const pricing = await this.pricingRepo.findOne({
      where: { categoryId: data.categoryId, urgencyTier: data.urgencyTier },
    });

    if (!pricing) {
      throw new AppError('Pricing not found for this category and urgency', 400);
    }

    // Create lead
    const lead = this.leadRepo.create({
      userId,
      categoryId: data.categoryId,
      urgencyTier: data.urgencyTier,
      description: data.description,
      lat: data.lat,
      lng: data.lng,
      address: data.address,
      photos: data.photos || [],
      priceMXN: pricing.priceMXN,
      isQualified: false,
      status: LeadStatus.PENDING,
      preferredSchedule: data.preferredSchedule,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h expiry
    });

    const savedLead = await this.leadRepo.save(lead);

    // Save chips
    for (const chipId of data.chipIds) {
      await this.chipRepo.save(
        this.chipRepo.create({ leadId: savedLead.id, categoryChipId: chipId })
      );
    }

    // Save conditional fields
    if (data.conditionalFields) {
      for (const cf of data.conditionalFields) {
        await this.fieldValueRepo.save(
          this.fieldValueRepo.create({
            leadId: savedLead.id,
            conditionalFieldId: cf.fieldId,
            value: cf.value,
          })
        );
      }
    }

    // Run matching
    const matches = await matchingService.matchLeadToProfessionals(savedLead);

    if (matches.length > 0) {
      savedLead.status = LeadStatus.MATCHED;
      await this.leadRepo.save(savedLead);
    }

    return {
      lead: savedLead,
      matchesFound: matches.length,
    };
  }

  async getUserLeads(userId: string, query: any) {
    const { page, limit } = parsePagination(query);

    const [leads, total] = await this.leadRepo.findAndCount({
      where: { userId },
      relations: ['category', 'chips', 'chips.categoryChip'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return paginatedResult(leads, total, { page, limit });
  }

  async getById(leadId: number, userId?: string) {
    const lead = await this.leadRepo.findOne({
      where: { id: leadId },
      relations: [
        'category', 'chips', 'chips.categoryChip',
        'conditionalFieldValues', 'conditionalFieldValues.conditionalField',
        'takenByProfessional', 'takenByProfessional.user',
      ],
    });

    if (!lead) throw new AppError('Lead not found', 404);

    // If userId provided, check ownership
    if (userId && lead.userId !== userId) {
      throw new AppError('Access denied', 403);
    }

    return lead;
  }

  async updateStatus(leadId: number, userId: string, newStatus: LeadStatus) {
    const lead = await this.leadRepo.findOne({ where: { id: leadId, userId } });
    if (!lead) throw new AppError('Lead not found', 404);

    // Validate transitions
    const validTransitions: Record<string, string[]> = {
      [LeadStatus.TAKEN]: [LeadStatus.IN_PROGRESS],
      [LeadStatus.IN_PROGRESS]: [LeadStatus.COMPLETED],
    };

    if (!validTransitions[lead.status]?.includes(newStatus)) {
      throw new AppError(`Cannot transition from ${lead.status} to ${newStatus}`, 400);
    }

    lead.status = newStatus;
    return this.leadRepo.save(lead);
  }

  async cancel(leadId: number, userId: string) {
    const lead = await this.leadRepo.findOne({ where: { id: leadId, userId } });
    if (!lead) throw new AppError('Lead not found', 404);

    if (lead.status === LeadStatus.COMPLETED || lead.status === LeadStatus.CANCELLED) {
      throw new AppError('Cannot cancel this lead', 400);
    }

    lead.status = LeadStatus.CANCELLED;
    return this.leadRepo.save(lead);
  }
}