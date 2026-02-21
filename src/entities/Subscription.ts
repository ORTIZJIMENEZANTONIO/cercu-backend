import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';
import { Plan } from './Plan';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  PAST_DUE = 'past_due',
}

@Entity('subscriptions')
@Index('idx_subscriptions_user_status', ['userId', 'status'])
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'int' })
  planId: number;

  @ManyToOne(() => Plan)
  @JoinColumn({ name: 'planId' })
  plan: Plan;

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
  status: SubscriptionStatus;

  @Column({ type: 'datetime' })
  currentPeriodStart: Date;

  @Column({ type: 'datetime' })
  currentPeriodEnd: Date;

  @Column({ default: true })
  autoRenew: boolean;

  @Column({ type: 'int', nullable: true })
  nextPlanId: number | null;

  @Column({ type: 'int', default: 0 })
  boostSlotsUsedThisPeriod: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
