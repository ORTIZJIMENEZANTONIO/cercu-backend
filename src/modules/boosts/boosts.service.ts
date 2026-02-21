import { AppDataSource } from '../../ormconfig';
import { BoostType } from '../../entities/BoostType';
import { ActiveBoost, BoostStatus } from '../../entities/ActiveBoost';
import { Subscription, SubscriptionStatus } from '../../entities/Subscription';
import { Wallet } from '../../entities/Wallet';
import { WalletTransaction, TransactionType, TransactionReason } from '../../entities/WalletTransaction';
import { ConfigKV } from '../../entities/ConfigKV';
import { AppError } from '../../middleware/errorHandler.middleware';
import { MoreThan } from 'typeorm';

export class BoostsService {
  private boostTypeRepo = AppDataSource.getRepository(BoostType);
  private activeBoostRepo = AppDataSource.getRepository(ActiveBoost);
  private subRepo = AppDataSource.getRepository(Subscription);
  private walletRepo = AppDataSource.getRepository(Wallet);
  private txRepo = AppDataSource.getRepository(WalletTransaction);
  private configRepo = AppDataSource.getRepository(ConfigKV);

  async listTypes() {
    return this.boostTypeRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async getActive(userId: string) {
    return this.activeBoostRepo.find({
      where: { userId, status: BoostStatus.ACTIVE, expiresAt: MoreThan(new Date()) },
      relations: ['boostType'],
      order: { expiresAt: 'ASC' },
    });
  }

  async purchase(userId: string, boostTypeId: number, categoryId?: number) {
    const boostType = await this.boostTypeRepo.findOne({ where: { id: boostTypeId } });
    if (!boostType) throw new AppError('Boost type not found', 404);
    if (!boostType.isActive) throw new AppError('Boost type not available', 400);

    // Check for free slot from subscription
    let usedFreeSlot = false;
    let pricePaid = Number(boostType.priceMXN);
    let walletTransactionId: number | null = null;

    const sub = await this.subRepo.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      relations: ['plan'],
    });

    // Apply discount for premium plans
    if (sub?.plan && sub.plan.boostDiscountPercent > 0) {
      pricePaid = Math.round(pricePaid * (1 - sub.plan.boostDiscountPercent / 100));
    }

    if (sub?.plan && sub.plan.boostSlotsIncluded > sub.boostSlotsUsedThisPeriod) {
      // Use free slot
      usedFreeSlot = true;
      pricePaid = 0;
      sub.boostSlotsUsedThisPeriod += 1;
      await this.subRepo.save(sub);
    } else {
      // Debit wallet
      const wallet = await this.walletRepo.findOne({ where: { userId } });
      if (!wallet) throw new AppError('Wallet not found', 404);

      if (Number(wallet.balance) < pricePaid) {
        throw new AppError('Saldo insuficiente', 400);
      }
      if (wallet.isFrozen) throw new AppError('Wallet is frozen', 400);

      wallet.balance = Number(wallet.balance) - pricePaid;
      wallet.totalSpent = Number(wallet.totalSpent) + pricePaid;
      await this.walletRepo.save(wallet);

      const tx = await this.txRepo.save(
        this.txRepo.create({
          walletId: wallet.id,
          type: TransactionType.DEBIT,
          reason: TransactionReason.BOOST_PURCHASE,
          amount: pricePaid,
          balanceAfter: wallet.balance,
          referenceType: 'boost',
          notes: `Boost: ${boostType.name}${categoryId ? ` (cat: ${categoryId})` : ''}`,
        })
      );
      walletTransactionId = tx.id;
    }

    const now = new Date();
    const boost = this.activeBoostRepo.create({
      userId,
      boostTypeId: boostType.id,
      categoryId: categoryId || null,
      scoreBonus: boostType.scoreBonus,
      status: BoostStatus.ACTIVE,
      startsAt: now,
      expiresAt: new Date(now.getTime() + boostType.durationHours * 60 * 60 * 1000),
      pricePaid,
      usedFreeSlot,
      walletTransactionId,
    });

    return this.activeBoostRepo.save(boost);
  }

  // ─── Boost rotation: get promoted pro IDs for a category/zone ───

  async getPromotedForCategory(categoryId: number): Promise<ActiveBoost[]> {
    const maxPerBlock = await this.getConfigValue('boost_max_per_block', 1);

    // Get all active boosts for this category (or global boosts with null categoryId)
    const boosts = await this.activeBoostRepo
      .createQueryBuilder('b')
      .where('b.status = :status', { status: BoostStatus.ACTIVE })
      .andWhere('b.expiresAt > :now', { now: new Date() })
      .andWhere('(b.categoryId = :catId OR b.categoryId IS NULL)', { catId: categoryId })
      .orderBy('b.createdAt', 'ASC') // oldest first for fair rotation
      .getMany();

    if (boosts.length === 0) return [];

    // Rotate: use a simple round-robin based on current time
    const rotationIndex = Math.floor(Date.now() / (5 * 60 * 1000)) % boosts.length; // rotate every 5 minutes
    const selected: ActiveBoost[] = [];
    for (let i = 0; i < Math.min(maxPerBlock, boosts.length); i++) {
      selected.push(boosts[(rotationIndex + i) % boosts.length]);
    }

    return selected;
  }

  private async getConfigValue(key: string, defaultVal: number): Promise<number> {
    const config = await this.configRepo.findOne({ where: { key } });
    return Number(config?.value || defaultVal);
  }
}
