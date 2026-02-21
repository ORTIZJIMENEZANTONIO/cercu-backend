import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';

@Entity('user_trust_scores')
@Index('idx_user_trust_scores_user', ['userId'], { unique: true })
export class UserTrustScore {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'int', default: 50 })
  score: number;

  @Column({ type: 'json', nullable: true })
  breakdown: {
    completedRatio?: number;
    cancellationPenalty?: number;
    timeOnPlatform?: number;
    profileCompleteness?: number;
    reportsPenalty?: number;
  } | null;

  @Column({ type: 'datetime', nullable: true })
  lastCalculatedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
