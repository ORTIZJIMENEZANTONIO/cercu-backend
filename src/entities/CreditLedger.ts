import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';

export enum CreditReason {
  ACHIEVEMENT_REWARD = 'achievement_reward',
  MISSION_REWARD = 'mission_reward',
  REFERRAL_BONUS = 'referral_bonus',
  ADMIN_GRANT = 'admin_grant',
  PROMO = 'promo',
}

@Entity('credit_ledger')
@Index('idx_credit_ledger_user_month', ['userId', 'monthKey'])
export class CreditLedger {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: CreditReason })
  reason: CreditReason;

  @Column({ type: 'varchar', length: 50, nullable: true })
  referenceType: string | null;

  @Column({ type: 'int', nullable: true })
  referenceId: number | null;

  @Column({ type: 'varchar', length: 7 })
  monthKey: string; // YYYY-MM format for monthly cap tracking

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
