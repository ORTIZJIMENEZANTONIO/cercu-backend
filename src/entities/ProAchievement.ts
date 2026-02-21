import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from './User';
import { Achievement } from './Achievement';

@Entity('pro_achievements')
@Unique('idx_pro_achievements_user_achievement', ['userId', 'achievementId'])
@Index('idx_pro_achievements_user', ['userId'])
export class ProAchievement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'int' })
  achievementId: number;

  @ManyToOne(() => Achievement)
  @JoinColumn({ name: 'achievementId' })
  achievement: Achievement;

  @CreateDateColumn()
  earnedAt: Date;
}
