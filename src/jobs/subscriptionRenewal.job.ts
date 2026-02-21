import { AppDataSource } from '../ormconfig';
import { Subscription, SubscriptionStatus } from '../entities/Subscription';
import { Plan } from '../entities/Plan';
import { Wallet } from '../entities/Wallet';
import { WalletTransaction, TransactionType, TransactionReason } from '../entities/WalletTransaction';

export async function renewSubscriptions() {
  const subRepo = AppDataSource.getRepository(Subscription);
  const planRepo = AppDataSource.getRepository(Plan);
  const walletRepo = AppDataSource.getRepository(Wallet);
  const txRepo = AppDataSource.getRepository(WalletTransaction);

  const subs = await subRepo.find({
    where: { status: SubscriptionStatus.ACTIVE },
    relations: ['plan'],
  });

  const now = new Date();

  for (const sub of subs) {
    if (new Date(sub.currentPeriodEnd) > now) continue;

    try {
      if (!sub.autoRenew) {
        sub.status = SubscriptionStatus.EXPIRED;
        await subRepo.save(sub);
        continue;
      }

      // Apply pending plan change
      let renewPlan = sub.plan;
      if (sub.nextPlanId) {
        const nextPlan = await planRepo.findOne({ where: { id: sub.nextPlanId } });
        if (nextPlan) {
          renewPlan = nextPlan;
          sub.planId = nextPlan.id;
          sub.nextPlanId = null;
        }
      }

      // Debit wallet for paid plans
      if (Number(renewPlan.priceMXN) > 0) {
        const wallet = await walletRepo.findOne({ where: { userId: sub.userId } });
        if (!wallet || Number(wallet.balance) < Number(renewPlan.priceMXN) || wallet.isFrozen) {
          sub.status = SubscriptionStatus.PAST_DUE;
          await subRepo.save(sub);
          continue;
        }

        wallet.balance = Number(wallet.balance) - Number(renewPlan.priceMXN);
        wallet.totalSpent = Number(wallet.totalSpent) + Number(renewPlan.priceMXN);
        await walletRepo.save(wallet);

        await txRepo.save(
          txRepo.create({
            walletId: wallet.id,
            type: TransactionType.DEBIT,
            reason: TransactionReason.SUBSCRIPTION_PAYMENT,
            amount: Number(renewPlan.priceMXN),
            balanceAfter: wallet.balance,
            referenceType: 'subscription',
            referenceId: sub.id,
            notes: `Subscription renewal: ${renewPlan.name}`,
          })
        );
      }

      // Renew
      sub.currentPeriodStart = now;
      sub.currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      sub.boostSlotsUsedThisPeriod = 0;
      sub.status = SubscriptionStatus.ACTIVE;
      await subRepo.save(sub);
    } catch (err) {
      console.error(`Failed to renew subscription ${sub.id}:`, err);
    }
  }
}
