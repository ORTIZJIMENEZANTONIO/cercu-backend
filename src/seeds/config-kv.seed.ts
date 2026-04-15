import { AppDataSource } from '../ormconfig';
import { ConfigKV } from '../entities/ConfigKV';

const defaults: { key: string; value: string; description: string }[] = [
  // Matching & Boosts
  { key: 'boost_score_cap', value: '15', description: 'Max boost bonus in matching algorithm' },
  { key: 'boost_max_per_block', value: '1', description: 'Max promoted boosts per category block' },

  // Client protection
  { key: 'client_protection_days', value: '30', description: 'Days window for anti-bypass protection' },
  { key: 'client_protection_fee', value: '5', description: 'Anti-bypass fee in MXN' },

  // Credit caps
  { key: 'credit_monthly_cap_user', value: '50', description: 'Max monthly credits for users (achievement/mission rewards)' },
  { key: 'credit_monthly_cap_pro', value: '100', description: 'Max monthly credits for professionals (achievement/mission rewards)' },

  // Trust score
  { key: 'trust_score_base', value: '50', description: 'Base trust score for new users' },

  // XP awards
  { key: 'xp_job_completed', value: '50', description: 'XP awarded for completing a job' },
  { key: 'xp_high_rating', value: '25', description: 'XP awarded for receiving a high rating' },
  { key: 'xp_fast_response', value: '15', description: 'XP awarded for fast response time' },
  { key: 'xp_consecutive', value: '10', description: 'XP awarded for consecutive completed jobs' },
];

export async function seedConfigKV() {
  const repo = AppDataSource.getRepository(ConfigKV);

  for (const item of defaults) {
    const existing = await repo.findOne({ where: { key: item.key } });
    if (!existing) {
      await repo.save(repo.create(item));
      console.log(`  ConfigKV: created "${item.key}" = ${item.value}`);
    }
  }

  console.log('ConfigKV seed complete');
}
