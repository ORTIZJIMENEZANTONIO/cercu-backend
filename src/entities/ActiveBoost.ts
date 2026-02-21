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
import { BoostType } from './BoostType';
import { Category } from './Category';

export enum BoostStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity('active_boosts')
@Index('idx_active_boosts_user_status', ['userId', 'status', 'expiresAt'])
@Index('idx_active_boosts_category', ['categoryId', 'status', 'expiresAt'])
export class ActiveBoost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'int' })
  boostTypeId: number;

  @ManyToOne(() => BoostType)
  @JoinColumn({ name: 'boostTypeId' })
  boostType: BoostType;

  @Column({ type: 'int', nullable: true })
  categoryId: number | null;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category | null;

  @Column({ type: 'int' })
  scoreBonus: number;

  @Column({ type: 'enum', enum: BoostStatus, default: BoostStatus.ACTIVE })
  status: BoostStatus;

  @Column({ type: 'datetime' })
  startsAt: Date;

  @Column({ type: 'datetime' })
  expiresAt: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  pricePaid: number;

  @Column({ default: false })
  usedFreeSlot: boolean;

  @Column({ type: 'int', nullable: true })
  walletTransactionId: number | null;

  @CreateDateColumn()
  createdAt: Date;
}
