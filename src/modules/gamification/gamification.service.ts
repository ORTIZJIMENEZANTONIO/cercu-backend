import { AppDataSource } from '../../ormconfig';
import { ProfessionalProfile } from '../../entities/ProfessionalProfile';
import { ProLevel } from '../../entities/ProLevel';
import { ProXPLog, XPReason } from '../../entities/ProXPLog';
import { Achievement, AchievementTriggerType, AchievementTarget } from '../../entities/Achievement';
import { ProAchievement } from '../../entities/ProAchievement';
import { ActiveMission, MissionStatus } from '../../entities/ActiveMission';
import { MissionTemplate, MissionType } from '../../entities/MissionTemplate';
import { UserTrustScore } from '../../entities/UserTrustScore';
import { Wallet } from '../../entities/Wallet';
import { WalletTransaction, TransactionType, TransactionReason } from '../../entities/WalletTransaction';
import { CreditLedger, CreditReason } from '../../entities/CreditLedger';
import { ConfigKV } from '../../entities/ConfigKV';
import { User } from '../../entities/User';
import { Lead, LeadStatus } from '../../entities/Lead';
import { Report } from '../../entities/Report';
import { AppError } from '../../middleware/errorHandler.middleware';
import { parsePagination, paginatedResult } from '../../utils/pagination';

export class GamificationService {
  private profileRepo = AppDataSource.getRepository(ProfessionalProfile);
  private levelRepo = AppDataSource.getRepository(ProLevel);
  private xpLogRepo = AppDataSource.getRepository(ProXPLog);
  private achievementRepo = AppDataSource.getRepository(Achievement);
  private proAchievementRepo = AppDataSource.getRepository(ProAchievement);
  private missionRepo = AppDataSource.getRepository(ActiveMission);
  private missionTemplateRepo = AppDataSource.getRepository(MissionTemplate);
  private trustScoreRepo = AppDataSource.getRepository(UserTrustScore);
  private walletRepo = AppDataSource.getRepository(Wallet);
  private txRepo = AppDataSource.getRepository(WalletTransaction);
  private creditLedgerRepo = AppDataSource.getRepository(CreditLedger);
  private configRepo = AppDataSource.getRepository(ConfigKV);
  private userRepo = AppDataSource.getRepository(User);
  private leadRepo = AppDataSource.getRepository(Lead);
  private reportRepo = AppDataSource.getRepository(Report);

  // ─── Dashboard ───

  async getDashboard(userId: string) {
    const profile = await this.profileRepo.findOne({ where: { userId } });

    const levels = await this.levelRepo.find({ order: { level: 'ASC' } });
    const currentLevelData = levels.find((l) => l.level === (profile?.currentLevel ?? 1));
    const nextLevelData = levels.find((l) => l.level === (profile?.currentLevel ?? 1) + 1);

    const recentXP = await this.xpLogRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const activeMissions = await this.missionRepo.count({
      where: { userId, status: MissionStatus.IN_PROGRESS },
    });

    const totalAchievements = await this.achievementRepo.count({ where: { isActive: true } });
    const earnedAchievements = await this.proAchievementRepo.count({
      where: { userId },
    });

    return {
      totalXP: profile?.totalXP ?? 0,
      currentLevel: profile?.currentLevel ?? 1,
      levelName: currentLevelData?.name ?? 'Novato',
      levelIcon: currentLevelData?.icon ?? null,
      xpForCurrentLevel: currentLevelData?.xpRequired ?? 0,
      xpForNextLevel: nextLevelData?.xpRequired ?? null,
      nextLevelName: nextLevelData?.name ?? null,
      consecutiveCompletions: profile?.consecutiveCompletions ?? 0,
      recentXP,
      activeMissions,
      earnedAchievements,
      totalAchievements,
    };
  }

  // ─── Achievements ───

  async getAchievements(userId: string) {
    const allAchievements = await this.achievementRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });

    const earned = await this.proAchievementRepo.find({
      where: { userId },
    });
    const earnedMap = new Map(earned.map((e) => [e.achievementId, e.earnedAt]));

    return allAchievements.map((a) => ({
      ...a,
      earned: earnedMap.has(a.id),
      earnedAt: earnedMap.get(a.id) || null,
    }));
  }

  // ─── Missions ───

  async getMissions(userId: string) {
    const missions = await this.missionRepo.find({
      where: { userId, status: MissionStatus.IN_PROGRESS },
      relations: ['missionTemplate'],
      order: { weekEnd: 'ASC' },
    });

    return missions.map((m) => ({
      id: m.id,
      name: m.missionTemplate.name,
      description: m.missionTemplate.description,
      icon: m.missionTemplate.icon,
      missionType: m.missionTemplate.missionType,
      current: Number(m.currentProgress),
      target: Number(m.targetValue),
      status: m.status,
      reward: m.missionTemplate.reward,
      weekEnd: m.weekEnd,
    }));
  }

  // ─── XP History ───

  async getXPHistory(userId: string, query: any) {
    const { page, limit } = parsePagination(query);

    const [logs, total] = await this.xpLogRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return paginatedResult(logs, total, { page, limit });
  }

  // ─── Trust Score ───

  async getTrustScore(userId: string) {
    let ts = await this.trustScoreRepo.findOne({ where: { userId } });
    if (!ts) {
      ts = await this.calculateTrustScore(userId);
    }
    return ts;
  }

  // ─── Grant XP ───

  async grantXP(userId: string, amount: number, reason: XPReason, referenceId?: number) {
    await this.xpLogRepo.save(
      this.xpLogRepo.create({
        userId,
        xpAmount: amount,
        reason,
        referenceId: referenceId ?? null,
      })
    );

    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) return { newTotalXP: 0, leveledUp: false, newLevel: 1 };

    profile.totalXP += amount;

    const levels = await this.levelRepo.find({ order: { level: 'ASC' } });
    let leveledUp = false;
    let newLevel = profile.currentLevel;

    for (const lvl of levels) {
      if (lvl.level > profile.currentLevel && profile.totalXP >= lvl.xpRequired) {
        newLevel = lvl.level;
        leveledUp = true;

        if (lvl.perks && (lvl.perks as any).badge) {
          const badges = profile.badges || [];
          if (!badges.includes((lvl.perks as any).badge)) {
            badges.push((lvl.perks as any).badge);
            profile.badges = badges;
          }
        }
      }
    }

    if (leveledUp) {
      profile.currentLevel = newLevel;
    }

    await this.profileRepo.save(profile);
    return { newTotalXP: profile.totalXP, leveledUp, newLevel };
  }

  // ─── Check Achievements (Pro) ───

  async checkAchievements(userId: string) {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) return [];

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return [];

    const allAchievements = await this.achievementRepo.find({ where: { isActive: true } });
    const earned = await this.proAchievementRepo.find({ where: { userId } });
    const earnedIds = new Set(earned.map((e) => e.achievementId));

    const newlyEarned: ProAchievement[] = [];

    for (const ach of allAchievements) {
      if (earnedIds.has(ach.id)) continue;

      // Filter by target
      if (ach.target === AchievementTarget.USER) continue; // Skip user-only for pro check

      let triggered = false;
      const targetValue = ach.triggerCondition.value;

      switch (ach.triggerType) {
        case AchievementTriggerType.COMPLETED_JOBS_COUNT:
          triggered = profile.completedJobs >= targetValue;
          break;
        case AchievementTriggerType.RATING_THRESHOLD:
          triggered = Number(profile.rating) >= targetValue;
          break;
        case AchievementTriggerType.AVG_RESPONSE_TIME:
        case AchievementTriggerType.FAST_RESPONSE:
          triggered = profile.avgResponseTimeMinutes > 0 && profile.avgResponseTimeMinutes <= targetValue;
          break;
        case AchievementTriggerType.CONSECUTIVE_COMPLETIONS:
          triggered = profile.consecutiveCompletions >= targetValue;
          break;
        case AchievementTriggerType.DAYS_ON_PLATFORM: {
          const days = Math.floor(
            (Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          );
          triggered = days >= targetValue;
          break;
        }
        case AchievementTriggerType.LEADS_TAKEN:
          triggered = (profile.completedJobs + (profile as any).takenLeadsCount || profile.completedJobs) >= targetValue;
          break;
        case AchievementTriggerType.NO_LATE_CANCELLATIONS: {
          // Check no late cancellations in the last N days
          triggered = Number(profile.cancellationRate) === 0;
          break;
        }
      }

      if (triggered) {
        const proAch = await this.proAchievementRepo.save(
          this.proAchievementRepo.create({ userId, achievementId: ach.id })
        );
        newlyEarned.push(proAch);
        await this.grantAchievementReward(userId, ach);
      }
    }

    return newlyEarned;
  }

  // ─── Check Achievements (User) ───

  async checkUserAchievements(userId: string, eventData?: {
    phoneVerified?: boolean;
    addressSaved?: boolean;
    serviceCompleted?: boolean;
    servicesCount?: number;
    reviewGiven?: boolean;
    photoUploaded?: boolean;
    descriptionLength?: number;
  }) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return [];

    const allAchievements = await this.achievementRepo.find({ where: { isActive: true } });
    const earned = await this.proAchievementRepo.find({ where: { userId } });
    const earnedIds = new Set(earned.map((e) => e.achievementId));

    const totalLeads = await this.leadRepo.count({ where: { userId } });
    const completedLeads = await this.leadRepo.count({ where: { userId, status: LeadStatus.COMPLETED } });

    const newlyEarned: ProAchievement[] = [];

    for (const ach of allAchievements) {
      if (earnedIds.has(ach.id)) continue;
      if (ach.target === AchievementTarget.PRO) continue; // Skip pro-only

      let triggered = false;
      const targetValue = ach.triggerCondition.value;

      switch (ach.triggerType) {
        case AchievementTriggerType.PHONE_VERIFIED:
          triggered = !!user.phoneVerified || !!eventData?.phoneVerified;
          break;
        case AchievementTriggerType.ADDRESS_SAVED:
          triggered = !!eventData?.addressSaved;
          break;
        case AchievementTriggerType.FIRST_SERVICE:
          triggered = completedLeads >= 1 || !!eventData?.serviceCompleted;
          break;
        case AchievementTriggerType.SERVICES_COMPLETED:
          triggered = completedLeads >= targetValue || (eventData?.servicesCount ?? 0) >= targetValue;
          break;
        case AchievementTriggerType.REVIEW_GIVEN:
          triggered = !!eventData?.reviewGiven;
          break;
        case AchievementTriggerType.PHOTO_UPLOADED:
          triggered = !!eventData?.photoUploaded;
          break;
        case AchievementTriggerType.DESCRIPTION_QUALITY:
          triggered = (eventData?.descriptionLength ?? 0) >= targetValue;
          break;
        case AchievementTriggerType.NO_LATE_CANCELLATIONS: {
          const cancelledLeads = await this.leadRepo.count({ where: { userId, status: LeadStatus.CANCELLED } });
          triggered = cancelledLeads === 0 && totalLeads > 0;
          break;
        }
        case AchievementTriggerType.DAYS_ON_PLATFORM: {
          const days = Math.floor(
            (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          );
          triggered = days >= targetValue;
          break;
        }
      }

      if (triggered) {
        const proAch = await this.proAchievementRepo.save(
          this.proAchievementRepo.create({ userId, achievementId: ach.id })
        );
        newlyEarned.push(proAch);
        await this.grantAchievementReward(userId, ach);
      }
    }

    return newlyEarned;
  }

  // ─── Achievement Reward with Credit Cap ───

  private async grantAchievementReward(userId: string, ach: Achievement) {
    if (!ach.reward) return;

    if (ach.reward.xp) {
      await this.grantXP(userId, ach.reward.xp, XPReason.ACHIEVEMENT_REWARD, ach.id);
    }

    if (ach.reward.walletCreditMXN) {
      const canCredit = await this.checkCreditCap(userId, ach.reward.walletCreditMXN);
      if (canCredit) {
        const wallet = await this.walletRepo.findOne({ where: { userId } });
        if (wallet) {
          wallet.balance = Number(wallet.balance) + ach.reward.walletCreditMXN;
          await this.walletRepo.save(wallet);
          await this.txRepo.save(
            this.txRepo.create({
              walletId: wallet.id,
              type: TransactionType.CREDIT,
              reason: TransactionReason.ACHIEVEMENT_REWARD,
              amount: ach.reward.walletCreditMXN,
              balanceAfter: wallet.balance,
              referenceType: 'achievement',
              referenceId: ach.id,
              notes: `Achievement reward: ${ach.name}`,
            })
          );
          await this.recordCredit(userId, ach.reward.walletCreditMXN, CreditReason.ACHIEVEMENT_REWARD, 'achievement', ach.id);
        }
      }
    }
  }

  // ─── Credit Cap Enforcement ───

  private async checkCreditCap(userId: string, amount: number): Promise<boolean> {
    const capConfig = await this.configRepo.findOne({ where: { key: 'credit_cap_user_monthly' } });
    const cap = Number(capConfig?.value || 50);

    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const result = await this.creditLedgerRepo
      .createQueryBuilder('cl')
      .select('COALESCE(SUM(cl.amount), 0)', 'total')
      .where('cl.userId = :userId', { userId })
      .andWhere('cl.monthKey = :monthKey', { monthKey })
      .getRawOne();

    const used = Number(result?.total || 0);
    return (used + amount) <= cap;
  }

  private async recordCredit(
    userId: string, amount: number, reason: CreditReason,
    referenceType: string, referenceId: number
  ) {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    await this.creditLedgerRepo.save(
      this.creditLedgerRepo.create({
        userId, amount, reason, referenceType, referenceId, monthKey,
      })
    );
  }

  // ─── Update Mission Progress ───

  async updateMissionProgress(userId: string, eventType: MissionType, increment: number) {
    const missions = await this.missionRepo.find({
      where: { userId, status: MissionStatus.IN_PROGRESS },
      relations: ['missionTemplate'],
    });

    const updated: ActiveMission[] = [];

    for (const mission of missions) {
      if (mission.missionTemplate.missionType !== eventType) continue;

      mission.currentProgress = Number(mission.currentProgress) + increment;

      if (mission.currentProgress >= Number(mission.targetValue)) {
        mission.status = MissionStatus.COMPLETED;
        mission.completedAt = new Date();

        const reward = mission.missionTemplate.reward;
        if (reward) {
          if (reward.xp) {
            await this.grantXP(userId, reward.xp, XPReason.MISSION_REWARD, mission.missionTemplateId);
          }
          if (reward.walletCreditMXN) {
            const canCredit = await this.checkCreditCap(userId, reward.walletCreditMXN);
            if (canCredit) {
              const wallet = await this.walletRepo.findOne({ where: { userId } });
              if (wallet) {
                wallet.balance = Number(wallet.balance) + reward.walletCreditMXN;
                await this.walletRepo.save(wallet);
                await this.txRepo.save(
                  this.txRepo.create({
                    walletId: wallet.id,
                    type: TransactionType.CREDIT,
                    reason: TransactionReason.MISSION_REWARD,
                    amount: reward.walletCreditMXN,
                    balanceAfter: wallet.balance,
                    referenceType: 'mission',
                    referenceId: mission.id,
                    notes: `Mission reward: ${mission.missionTemplate.name}`,
                  })
                );
                await this.recordCredit(userId, reward.walletCreditMXN, CreditReason.MISSION_REWARD, 'mission', mission.id);
              }
            }
          }
        }
      }

      await this.missionRepo.save(mission);
      updated.push(mission);
    }

    return updated;
  }

  // ─── Trust Score Calculation ───

  async calculateTrustScore(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    const profile = await this.profileRepo.findOne({ where: { userId } });
    const totalLeads = await this.leadRepo.count({ where: { userId } });
    const completedLeads = await this.leadRepo.count({ where: { userId, status: LeadStatus.COMPLETED } });
    const cancelledLeads = await this.leadRepo.count({ where: { userId, status: LeadStatus.CANCELLED } });

    let reportCount = 0;
    try {
      reportCount = await this.reportRepo.count({ where: { targetUserId: userId } });
    } catch { /* Report entity may not have this field */ }

    const baseConfig = await this.configRepo.findOne({ where: { key: 'trust_score_base' } });
    const base = Number(baseConfig?.value || 50);

    const completedRatio = totalLeads > 0 ? Math.min((completedLeads / totalLeads) * 25, 25) : 0;
    const cancellationPenalty = totalLeads > 0 ? Math.min((cancelledLeads / totalLeads) * 20, 20) : 0;

    const daysSinceJoin = Math.floor(
      (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    const timeOnPlatform = Math.min((daysSinceJoin / 365) * 20, 20);

    let profileCompleteness = 0;
    if (user.name) profileCompleteness += 4;
    if (user.phone) profileCompleteness += 4;
    if (profile?.description) profileCompleteness += 4;
    if (profile?.businessName) profileCompleteness += 4;
    if (profile?.baseLat) profileCompleteness += 4;

    const reportsPenalty = Math.min(reportCount * 5, 15);

    const score = Math.max(
      0,
      Math.min(
        100,
        Math.round(base + completedRatio - cancellationPenalty + timeOnPlatform + profileCompleteness - reportsPenalty)
      )
    );

    const breakdown = {
      completedRatio: Math.round(completedRatio * 100) / 100,
      cancellationPenalty: Math.round(cancellationPenalty * 100) / 100,
      timeOnPlatform: Math.round(timeOnPlatform * 100) / 100,
      profileCompleteness,
      reportsPenalty,
    };

    let ts = await this.trustScoreRepo.findOne({ where: { userId } });
    if (ts) {
      ts.score = score;
      ts.breakdown = breakdown;
      ts.lastCalculatedAt = new Date();
    } else {
      ts = this.trustScoreRepo.create({
        userId,
        score,
        breakdown,
        lastCalculatedAt: new Date(),
      });
    }

    return this.trustScoreRepo.save(ts);
  }
}
