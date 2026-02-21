import cron from 'node-cron';
import { expireBoosts } from './boostExpiration.job';
import { renewSubscriptions } from './subscriptionRenewal.job';
import { rotateMissions } from './weeklyMissionRotation.job';
import { recalculateTrustScores } from './dailyTrustScore.job';

export function initCronJobs() {
  console.log('Initializing cron jobs...');

  // Every 15 minutes: expire active boosts
  cron.schedule('*/15 * * * *', async () => {
    try {
      await expireBoosts();
    } catch (err) {
      console.error('Boost expiration job failed:', err);
    }
  });

  // Daily at 00:05: renew subscriptions
  cron.schedule('5 0 * * *', async () => {
    try {
      await renewSubscriptions();
    } catch (err) {
      console.error('Subscription renewal job failed:', err);
    }
  });

  // Monday at 00:01: rotate weekly missions
  cron.schedule('1 0 * * 1', async () => {
    try {
      await rotateMissions();
    } catch (err) {
      console.error('Mission rotation job failed:', err);
    }
  });

  // Daily at 03:00: recalculate trust scores
  cron.schedule('0 3 * * *', async () => {
    try {
      await recalculateTrustScores();
    } catch (err) {
      console.error('Trust score recalculation failed:', err);
    }
  });

  console.log('Cron jobs initialized');
}
