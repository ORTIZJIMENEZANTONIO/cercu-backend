import { AppDataSource } from '../ormconfig';
import { ActiveMission, MissionStatus } from '../entities/ActiveMission';
import { MissionTemplate, MinPlan } from '../entities/MissionTemplate';
import { ProfessionalProfile, OnboardingStatus } from '../entities/ProfessionalProfile';
import { Subscription, SubscriptionStatus } from '../entities/Subscription';
import { In } from 'typeorm';

// Plan slug → MinPlan tier mapping (higher index = higher tier)
const PLAN_TIER: Record<string, number> = {
  starter: 0,
  normal: 1,
  premium: 2,
};

const MIN_PLAN_TIER: Record<MinPlan, number> = {
  [MinPlan.STARTER]: 0,
  [MinPlan.NORMAL]: 1,
  [MinPlan.PREMIUM]: 2,
};

export async function rotateMissions() {
  const missionRepo = AppDataSource.getRepository(ActiveMission);
  const templateRepo = AppDataSource.getRepository(MissionTemplate);
  const profileRepo = AppDataSource.getRepository(ProfessionalProfile);
  const subRepo = AppDataSource.getRepository(Subscription);

  // 1. Expire old in_progress missions
  await missionRepo
    .createQueryBuilder()
    .update(ActiveMission)
    .set({ status: MissionStatus.EXPIRED })
    .where('status = :status', { status: MissionStatus.IN_PROGRESS })
    .execute();

  // 2. Get active templates sorted by sortOrder
  const templates = await templateRepo.find({
    where: { isActive: true },
    order: { sortOrder: 'ASC' },
  });
  if (templates.length === 0) return;

  // 3. Get all approved professionals
  const pros = await profileRepo.find({
    where: [
      { onboardingStatus: OnboardingStatus.COMPLETED },
      { onboardingStatus: OnboardingStatus.APPROVED },
    ],
  });

  if (pros.length === 0) return;

  // 4. Batch-load active subscriptions for all pros
  const proUserIds = pros.map((p) => p.userId);
  const subs = await subRepo.find({
    where: { userId: In(proUserIds), status: SubscriptionStatus.ACTIVE },
    relations: ['plan'],
  });
  const subMap: Record<string, Subscription> = {};
  for (const sub of subs) {
    subMap[sub.userId] = sub;
  }

  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  let totalAssigned = 0;

  // 5. Assign missions per professional based on their plan
  for (const pro of pros) {
    const sub = subMap[pro.userId];
    const planSlug = sub?.plan?.slug || 'starter';
    const proTier = PLAN_TIER[planSlug] ?? 0;
    const maxMissions = sub?.plan?.maxMissionsPerWeek ?? 1;

    // Filter templates eligible for this pro's plan tier
    const eligible = templates.filter(
      (t) => MIN_PLAN_TIER[t.minPlan] <= proTier
    );

    if (eligible.length === 0) continue;

    // Shuffle eligible templates and pick up to maxMissions
    const shuffled = [...eligible].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, maxMissions);

    for (const template of selected) {
      try {
        await missionRepo.save(
          missionRepo.create({
            userId: pro.userId,
            missionTemplateId: template.id,
            status: MissionStatus.IN_PROGRESS,
            currentProgress: 0,
            targetValue: template.targetCondition.targetValue,
            weekStart: now,
            weekEnd,
          })
        );
        totalAssigned++;
      } catch (err) {
        console.error(`Failed to assign mission ${template.slug} to ${pro.userId}:`, err);
      }
    }
  }

  console.log(`Mission rotation: assigned ${totalAssigned} missions to ${pros.length} professionals`);
}
