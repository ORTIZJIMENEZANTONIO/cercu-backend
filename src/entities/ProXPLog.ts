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

export enum XPReason {
  JOB_COMPLETED = 'job_completed',
  HIGH_RATING = 'high_rating',
  FAST_RESPONSE = 'fast_response',
  CONSECUTIVE_COMPLETION = 'consecutive_completion',
  MISSION_REWARD = 'mission_reward',
  ACHIEVEMENT_REWARD = 'achievement_reward',
  ADMIN_GRANT = 'admin_grant',
}

@Entity('pro_xp_logs')
@Index('idx_pro_xp_log_user', ['userId'])
export class ProXPLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'int' })
  xpAmount: number;

  @Column({ type: 'enum', enum: XPReason })
  reason: XPReason;

  @Column({ type: 'int', nullable: true })
  referenceId: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
