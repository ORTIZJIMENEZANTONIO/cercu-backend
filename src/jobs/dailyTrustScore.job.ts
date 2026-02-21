import { AppDataSource } from '../ormconfig';
import { User } from '../entities/User';
import { ProfessionalProfile } from '../entities/ProfessionalProfile';
import { Lead, LeadStatus } from '../entities/Lead';
import { Report } from '../entities/Report';
import { UserTrustScore } from '../entities/UserTrustScore';

export async function recalculateTrustScores() {
  const userRepo = AppDataSource.getRepository(User);
  const profileRepo = AppDataSource.getRepository(ProfessionalProfile);
  const leadRepo = AppDataSource.getRepository(Lead);
  const reportRepo = AppDataSource.getRepository(Report);
  const trustRepo = AppDataSource.getRepository(UserTrustScore);

  const users = await userRepo.find({ where: { isActive: true } });

  for (const user of users) {
    try {
      const totalLeads = await leadRepo.count({ where: { userId: user.id } });
      const completedLeads = await leadRepo.count({ where: { userId: user.id, status: LeadStatus.COMPLETED } });
      const cancelledLeads = await leadRepo.count({ where: { userId: user.id, status: LeadStatus.CANCELLED } });

      let reportCount = 0;
      try {
        reportCount = await reportRepo.count({ where: { targetUserId: user.id } });
      } catch { /* Report entity may not have this field */ }

      const profile = await profileRepo.findOne({ where: { userId: user.id } });

      const completedRatio = totalLeads > 0 ? Math.min((completedLeads / totalLeads) * 25, 25) : 0;
      const cancellationPenalty = totalLeads > 0 ? Math.min((cancelledLeads / totalLeads) * 20, 20) : 0;

      const daysSinceJoin = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      const timeOnPlatform = Math.min((daysSinceJoin / 365) * 20, 20);

      let profileCompleteness = 0;
      if (user.name) profileCompleteness += 4;
      if (user.phone) profileCompleteness += 4;
      if (profile?.description) profileCompleteness += 4;
      if (profile?.businessName) profileCompleteness += 4;
      if (profile?.baseLat) profileCompleteness += 4;

      const reportsPenalty = Math.min(reportCount * 5, 15);

      const score = Math.max(0, Math.min(100, Math.round(
        50 + completedRatio - cancellationPenalty + timeOnPlatform + profileCompleteness - reportsPenalty
      )));

      const breakdown = {
        completedRatio: Math.round(completedRatio * 100) / 100,
        cancellationPenalty: Math.round(cancellationPenalty * 100) / 100,
        timeOnPlatform: Math.round(timeOnPlatform * 100) / 100,
        profileCompleteness,
        reportsPenalty,
      };

      let trustScore = await trustRepo.findOne({ where: { userId: user.id } });
      if (trustScore) {
        trustScore.score = score;
        trustScore.breakdown = breakdown;
        trustScore.lastCalculatedAt = new Date();
      } else {
        trustScore = trustRepo.create({
          userId: user.id,
          score,
          breakdown,
          lastCalculatedAt: new Date(),
        });
      }
      await trustRepo.save(trustScore);
    } catch (err) {
      console.error(`Failed to calculate trust score for ${user.id}:`, err);
    }
  }
}
