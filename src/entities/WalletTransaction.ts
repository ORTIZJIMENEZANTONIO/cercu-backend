import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Wallet } from './Wallet';

export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export enum TransactionReason {
  TOPUP = 'topup',
  LEAD_PURCHASE = 'lead_purchase',
  REFUND = 'refund',
  ADMIN_ADJUSTMENT = 'admin_adjustment',
  BONUS = 'bonus',
  SUBSCRIPTION_PAYMENT = 'subscription_payment',
  BOOST_PURCHASE = 'boost_purchase',
  MISSION_REWARD = 'mission_reward',
  ACHIEVEMENT_REWARD = 'achievement_reward',
  CREDIT_REWARD = 'credit_reward',
}

@Entity('wallet_transactions')
export class WalletTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  walletId: number;

  @ManyToOne(() => Wallet, (wallet) => wallet.transactions)
  @JoinColumn({ name: 'walletId' })
  wallet: Wallet;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'enum', enum: TransactionReason })
  reason: TransactionReason;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  balanceAfter: number;

  @Column({ type: 'int', nullable: true })
  leadId: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  referenceType: string | null;

  @Column({ type: 'int', nullable: true })
  referenceId: number | null;

  @CreateDateColumn()
  createdAt: Date;
}
