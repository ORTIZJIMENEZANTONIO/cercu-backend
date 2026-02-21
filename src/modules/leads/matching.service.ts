import { AppDataSource } from '../../ormconfig';
import { ProfessionalProfile, OnboardingStatus } from '../../entities/ProfessionalProfile';
import { ProfessionalCategory } from '../../entities/ProfessionalCategory';
import { ProfessionalScheduleSlot } from '../../entities/ProfessionalScheduleSlot';
import { Wallet } from '../../entities/Wallet';
import { LeadMatch, MatchStatus } from '../../entities/LeadMatch';
import { Lead, LeadStatus } from '../../entities/Lead';
import { Subscription, SubscriptionStatus } from '../../entities/Subscription';
import { ActiveBoost, BoostStatus } from '../../entities/ActiveBoost';
import { ProLevel } from '../../entities/ProLevel';
import { ConfigKV } from '../../entities/ConfigKV';
import { haversineDistance, boundingBox } from '../../utils/haversine';
import { In } from 'typeorm';

interface MatchCandidate {
  profile: ProfessionalProfile;
  distance: number;
  score: number;
  baseScore: number;
  boostBonus: number;
  isBoosted: boolean;
}

export class MatchingService {
  private profileRepo = AppDataSource.getRepository(ProfessionalProfile);
  private proCatRepo = AppDataSource.getRepository(ProfessionalCategory);
  private scheduleRepo = AppDataSource.getRepository(ProfessionalScheduleSlot);
  private walletRepo = AppDataSource.getRepository(Wallet);
  private matchRepo = AppDataSource.getRepository(LeadMatch);
  private subRepo = AppDataSource.getRepository(Subscription);
  private boostRepo = AppDataSource.getRepository(ActiveBoost);
  private levelRepo = AppDataSource.getRepository(ProLevel);
  private leadRepo = AppDataSource.getRepository(Lead);
  private configRepo = AppDataSource.getRepository(ConfigKV);

  async matchLeadToProfessionals(lead: Lead, maxMatches = 10): Promise<LeadMatch[]> {
    // 1. Get bounding box for pre-filter
    const bbox = boundingBox(Number(lead.lat), Number(lead.lng), 25); // max 25km search

    // 2. Get all eligible professionals with bounding box pre-filter
    const candidates = await this.profileRepo
      .createQueryBuilder('p')
      .where('p.isAvailable = :avail', { avail: true })
      .andWhere('p.onboardingStatus IN (:...statuses)', {
        statuses: [OnboardingStatus.COMPLETED, OnboardingStatus.APPROVED],
      })
      .andWhere('p.baseLat BETWEEN :minLat AND :maxLat', {
        minLat: bbox.minLat,
        maxLat: bbox.maxLat,
      })
      .andWhere('p.baseLng BETWEEN :minLng AND :maxLng', {
        minLng: bbox.minLng,
        maxLng: bbox.maxLng,
      })
      .getMany();

    const validCandidates: MatchCandidate[] = [];

    // Batch-load subscriptions, boosts, and levels for all candidates
    const candidateUserIds = candidates.map((c) => c.userId);
    const subscriptionMap: Record<string, Subscription> = {};
    const boostMap: Record<string, ActiveBoost[]> = {};
    const levelMap: Record<number, ProLevel> = {};

    // Load boost score cap config
    const boostScoreCap = await this.getConfigValue('boost_score_cap', 15);

    if (candidateUserIds.length > 0) {
      const subs = await this.subRepo.find({
        where: { userId: In(candidateUserIds), status: SubscriptionStatus.ACTIVE },
        relations: ['plan'],
      });
      for (const sub of subs) {
        subscriptionMap[sub.userId] = sub;
      }

      // Get boosts matching this lead's category (or global)
      const boosts = await this.boostRepo
        .createQueryBuilder('b')
        .where('b.userId IN (:...userIds)', { userIds: candidateUserIds })
        .andWhere('b.status = :status', { status: BoostStatus.ACTIVE })
        .andWhere('b.expiresAt > :now', { now: new Date() })
        .andWhere('(b.categoryId = :catId OR b.categoryId IS NULL)', { catId: lead.categoryId })
        .getMany();
      for (const boost of boosts) {
        if (!boostMap[boost.userId]) boostMap[boost.userId] = [];
        boostMap[boost.userId].push(boost);
      }

      const levels = await this.levelRepo.find();
      for (const lvl of levels) {
        levelMap[lvl.level] = lvl;
      }
    }

    // Count leads taken today for lead-per-day filter
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Count leads this month for monthly limit
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    for (const profile of candidates) {
      // Hard filter: category match
      const hasCat = await this.proCatRepo.findOne({
        where: {
          professionalProfileId: profile.id,
          categoryId: lead.categoryId,
        },
      });
      if (!hasCat) continue;

      // Hard filter: distance
      const distance = haversineDistance(
        Number(lead.lat),
        Number(lead.lng),
        Number(profile.baseLat),
        Number(profile.baseLng)
      );
      if (distance > profile.serviceRadiusKm) continue;

      // Hard filter: wallet has enough balance for at least this lead price
      const wallet = await this.walletRepo.findOne({
        where: { userId: profile.userId },
      });
      if (!wallet || Number(wallet.balance) < Number(lead.priceMXN) || wallet.isFrozen) continue;

      // Hard filter: lead-per-day limit from plan
      const sub = subscriptionMap[profile.userId];
      if (sub?.plan) {
        const maxLeadsDay = sub.plan.maxLeadsPerDay;
        if (maxLeadsDay > 0) { // -1 = unlimited
          const takenToday = await this.leadRepo
            .createQueryBuilder('l')
            .where('l.takenByProfessionalId = :pid', { pid: profile.id })
            .andWhere('l.takenAt >= :todayStart', { todayStart })
            .getCount();
          if (takenToday >= maxLeadsDay) continue;
        }

        // Hard filter: monthly lead limit
        const maxLeadsMonth = sub.plan.maxLeadsPerMonth;
        if (maxLeadsMonth > 0) {
          const takenThisMonth = await this.leadRepo
            .createQueryBuilder('l')
            .where('l.takenByProfessionalId = :pid', { pid: profile.id })
            .andWhere('l.takenAt >= :monthStart', { monthStart })
            .getCount();
          if (takenThisMonth >= maxLeadsMonth) continue;
        }
      }

      // Hard filter: schedule (check if current day/time falls in a slot, or if receiveOutsideHours)
      if (!profile.receiveOutsideHours) {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

        const hasSlot = await this.scheduleRepo
          .createQueryBuilder('s')
          .where('s.professionalProfileId = :pid', { pid: profile.id })
          .andWhere('s.dayOfWeek = :dow', { dow: dayOfWeek })
          .andWhere('s.startTime <= :time', { time: currentTime })
          .andWhere('s.endTime >= :time', { time: currentTime })
          .getOne();

        if (!hasSlot) continue;
      }

      // Score calculation
      const baseScore = this.calculateScore(profile, distance);
      const planBoost = sub?.plan?.matchPriorityBoost ?? 0;
      const rawBoostBonus = (boostMap[profile.userId] || []).reduce((sum, b) => sum + b.scoreBonus, 0);
      const levelBonus = levelMap[profile.currentLevel]?.matchScoreBonus ?? 0;

      // Apply boost cap: boost bonus cannot exceed boostScoreCap over base
      const cappedBoostBonus = Math.min(rawBoostBonus, boostScoreCap);
      const isBoosted = rawBoostBonus > 0;

      const score = baseScore + planBoost + cappedBoostBonus + levelBonus;

      validCandidates.push({ profile, distance, score, baseScore, boostBonus: cappedBoostBonus, isBoosted });
    }

    // Sort by score desc, take top N
    validCandidates.sort((a, b) => b.score - a.score);
    const topMatches = validCandidates.slice(0, maxMatches);

    // Create LeadMatch entries
    const matches: LeadMatch[] = [];
    for (const candidate of topMatches) {
      const match = this.matchRepo.create({
        leadId: lead.id,
        professionalProfileId: candidate.profile.id,
        score: candidate.score,
        distanceKm: Math.round(candidate.distance * 100) / 100,
        status: MatchStatus.PENDING,
        isBoosted: candidate.isBoosted,
      });
      matches.push(await this.matchRepo.save(match));
    }

    return matches;
  }

  // ─── Anti-bypass: Check "Cliente protegido 30 días" ───

  async checkClientProtection(userId: string, professionalId: number): Promise<{
    isProtected: boolean;
    fee: number;
  }> {
    const daysConfig = await this.getConfigValue('client_protection_days', 30);
    const feeConfig = await this.getConfigValue('client_protection_fee', 5);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysConfig);

    const recentLead = await this.leadRepo
      .createQueryBuilder('l')
      .where('l.userId = :userId', { userId })
      .andWhere('l.takenByProfessionalId = :pid', { pid: professionalId })
      .andWhere('l.status = :status', { status: LeadStatus.COMPLETED })
      .andWhere('l.completedAt >= :cutoff', { cutoff })
      .getOne();

    if (recentLead) {
      return { isProtected: true, fee: feeConfig };
    }

    return { isProtected: false, fee: 0 };
  }

  private calculateScore(profile: ProfessionalProfile, distanceKm: number): number {
    let score = 0;

    // Distance score (30 points) — closer = better
    const maxRadius = profile.serviceRadiusKm || 10;
    const distanceRatio = 1 - distanceKm / maxRadius;
    score += Math.max(0, distanceRatio * 30);

    // Response time score (20 points) — faster = better
    const responseTime = profile.avgResponseTimeMinutes || 60;
    if (responseTime <= 5) score += 20;
    else if (responseTime <= 15) score += 15;
    else if (responseTime <= 30) score += 10;
    else if (responseTime <= 60) score += 5;

    // Rating score (10 points)
    score += (Number(profile.rating) / 5) * 10;

    // Volume/experience score (10 points)
    const jobs = profile.completedJobs || 0;
    if (jobs >= 100) score += 10;
    else if (jobs >= 50) score += 7;
    else if (jobs >= 20) score += 5;
    else if (jobs >= 5) score += 3;

    // Acceptance rate score (15 points)
    score += (Number(profile.acceptanceRate) / 100) * 15;

    // Cancellation penalty (-15 points max)
    score -= (Number(profile.cancellationRate) / 100) * 15;

    return Math.max(0, Math.round(score * 100) / 100);
  }

  private async getConfigValue(key: string, defaultVal: number): Promise<number> {
    const config = await this.configRepo.findOne({ where: { key } });
    return Number(config?.value || defaultVal);
  }
}
