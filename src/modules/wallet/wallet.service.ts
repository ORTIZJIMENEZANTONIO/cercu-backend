import { AppDataSource } from '../../ormconfig';
import { Wallet } from '../../entities/Wallet';
import { WalletTransaction, TransactionType, TransactionReason } from '../../entities/WalletTransaction';
import { AppError } from '../../middleware/errorHandler.middleware';
import { parsePagination, paginatedResult } from '../../utils/pagination';

export class WalletService {
  private walletRepo = AppDataSource.getRepository(Wallet);
  private txRepo = AppDataSource.getRepository(WalletTransaction);

  async getBalance(userId: string) {
    const wallet = await this.walletRepo.findOne({ where: { userId } });
    if (!wallet) throw new AppError('Wallet not found', 404);

    return {
      balance: Number(wallet.balance),
      totalLoaded: Number(wallet.totalLoaded),
      totalSpent: Number(wallet.totalSpent),
      isFrozen: wallet.isFrozen,
    };
  }

  async getTransactions(userId: string, query: any) {
    const wallet = await this.walletRepo.findOne({ where: { userId } });
    if (!wallet) throw new AppError('Wallet not found', 404);

    const { page, limit } = parsePagination(query);

    const [txs, total] = await this.txRepo.findAndCount({
      where: { walletId: wallet.id },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return paginatedResult(txs, total, { page, limit });
  }

  async topup(userId: string, amount: number) {
    if (amount <= 0 || amount > 10000) {
      throw new AppError('Amount must be between 1 and 10,000 MXN', 400);
    }

    const wallet = await this.walletRepo.findOne({ where: { userId } });
    if (!wallet) throw new AppError('Wallet not found', 404);

    if (wallet.isFrozen) {
      throw new AppError('Wallet is frozen', 400);
    }

    wallet.balance = Number(wallet.balance) + amount;
    wallet.totalLoaded = Number(wallet.totalLoaded) + amount;
    await this.walletRepo.save(wallet);

    const tx = this.txRepo.create({
      walletId: wallet.id,
      type: TransactionType.CREDIT,
      reason: TransactionReason.TOPUP,
      amount,
      balanceAfter: wallet.balance,
      notes: 'Mock topup',
    });
    await this.txRepo.save(tx);

    return {
      balance: Number(wallet.balance),
      transaction: tx,
    };
  }
}