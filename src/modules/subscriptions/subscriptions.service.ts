import { AppDataSource } from '../../ormconfig';
import { Subscription, SubscriptionStatus } from '../../entities/Subscription';
import { Plan } from '../../entities/Plan';
import { Wallet } from '../../entities/Wallet';
import { WalletTransaction, TransactionType, TransactionReason } from '../../entities/WalletTransaction';
import { AppError } from '../../middleware/errorHandler.middleware';

export class SubscriptionsService {
  private subRepo = AppDataSource.getRepository(Subscription);
  private planRepo = AppDataSource.getRepository(Plan);
  private walletRepo = AppDataSource.getRepository(Wallet);
  private txRepo = AppDataSource.getRepository(WalletTransaction);

  async getCurrent(userId: string) {
    const sub = await this.subRepo.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      relations: ['plan'],
    });
    return sub || null;
  }

  async subscribe(userId: string, planId: number) {
    // Check no existing active subscription
    const existing = await this.subRepo.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
    });
    if (existing) {
      throw new AppError('Ya tienes una suscripcion activa. Usa cambiar plan.', 400);
    }

    const plan = await this.planRepo.findOne({ where: { id: planId } });
    if (!plan) throw new AppError('Plan not found', 404);
    if (!plan.isActive) throw new AppError('Plan is not available', 400);

    // Debit wallet for paid plans
    if (Number(plan.priceMXN) > 0) {
      const wallet = await this.walletRepo.findOne({ where: { userId } });
      if (!wallet) throw new AppError('Wallet not found', 404);

      if (Number(wallet.balance) < Number(plan.priceMXN)) {
        throw new AppError('Saldo insuficiente', 400);
      }
      if (wallet.isFrozen) throw new AppError('Wallet is frozen', 400);

      wallet.balance = Number(wallet.balance) - Number(plan.priceMXN);
      wallet.totalSpent = Number(wallet.totalSpent) + Number(plan.priceMXN);
      await this.walletRepo.save(wallet);

      await this.txRepo.save(
        this.txRepo.create({
          walletId: wallet.id,
          type: TransactionType.DEBIT,
          reason: TransactionReason.SUBSCRIPTION_PAYMENT,
          amount: Number(plan.priceMXN),
          balanceAfter: wallet.balance,
          referenceType: 'subscription',
          notes: `Suscripcion: ${plan.name}`,
        })
      );
    }

    const now = new Date();
    const sub = this.subRepo.create({
      userId,
      planId: plan.id,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      autoRenew: true,
    });

    const saved = await this.subRepo.save(sub);
    return this.subRepo.findOne({ where: { id: saved.id }, relations: ['plan'] });
  }

  async cancel(userId: string) {
    const sub = await this.subRepo.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      relations: ['plan'],
    });
    if (!sub) throw new AppError('No active subscription found', 404);

    sub.autoRenew = false;
    return this.subRepo.save(sub);
  }

  async changePlan(userId: string, newPlanId: number) {
    const sub = await this.subRepo.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      relations: ['plan'],
    });
    if (!sub) throw new AppError('No active subscription found', 404);

    const newPlan = await this.planRepo.findOne({ where: { id: newPlanId } });
    if (!newPlan) throw new AppError('Plan not found', 404);
    if (!newPlan.isActive) throw new AppError('Plan is not available', 400);

    const currentPrice = Number(sub.plan.priceMXN);
    const newPrice = Number(newPlan.priceMXN);

    if (newPrice > currentPrice) {
      // Upgrade: prorate and apply immediately
      const proratedAmount = newPrice - currentPrice;

      if (proratedAmount > 0) {
        const wallet = await this.walletRepo.findOne({ where: { userId } });
        if (!wallet) throw new AppError('Wallet not found', 404);
        if (Number(wallet.balance) < proratedAmount) {
          throw new AppError('Saldo insuficiente para el upgrade', 400);
        }

        wallet.balance = Number(wallet.balance) - proratedAmount;
        wallet.totalSpent = Number(wallet.totalSpent) + proratedAmount;
        await this.walletRepo.save(wallet);

        await this.txRepo.save(
          this.txRepo.create({
            walletId: wallet.id,
            type: TransactionType.DEBIT,
            reason: TransactionReason.SUBSCRIPTION_PAYMENT,
            amount: proratedAmount,
            balanceAfter: wallet.balance,
            referenceType: 'subscription',
            referenceId: sub.id,
            notes: `Upgrade: ${sub.plan.name} -> ${newPlan.name}`,
          })
        );
      }

      sub.planId = newPlan.id;
      sub.boostSlotsUsedThisPeriod = 0;
      sub.nextPlanId = null;
    } else {
      // Downgrade: schedule for next renewal
      sub.nextPlanId = newPlan.id;
    }

    const saved = await this.subRepo.save(sub);
    return this.subRepo.findOne({ where: { id: saved.id }, relations: ['plan'] });
  }
}
