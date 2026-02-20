import { AppDataSource } from '../../ormconfig';
import { ProfessionalProfile, OnboardingStatus } from '../../entities/ProfessionalProfile';
import { ProfessionalCategory } from '../../entities/ProfessionalCategory';
import { ProfessionalScheduleSlot } from '../../entities/ProfessionalScheduleSlot';
import { Wallet } from '../../entities/Wallet';
import { LeadMatch, MatchStatus } from '../../entities/LeadMatch';
import { Lead } from '../../entities/Lead';
import { haversineDistance, boundingBox } from '../../utils/haversine';

interface MatchCandidate {
  profile: ProfessionalProfile;
  distance: number;
  score: number;
}

export class MatchingService {
  private profileRepo = AppDataSource.getRepository(ProfessionalProfile);
  private proCatRepo = AppDataSource.getRepository(ProfessionalCategory);
  private scheduleRepo = AppDataSource.getRepository(ProfessionalScheduleSlot);
  private walletRepo = AppDataSource.getRepository(Wallet);
  private matchRepo = AppDataSource.getRepository(LeadMatch);

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

      // Score calculation (0-100)
      const score = this.calculateScore(profile, distance);

      validCandidates.push({ profile, distance, score });
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
      });
      matches.push(await this.matchRepo.save(match));
    }

    return matches;
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

    return Math.max(0, Math.min(100, Math.round(score * 100) / 100));
  }
}