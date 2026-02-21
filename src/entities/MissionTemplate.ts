import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum MissionType {
  COMPLETE_JOBS = 'complete_jobs',
  MAINTAIN_RATING = 'maintain_rating',
  FAST_RESPONSES = 'fast_responses',
  TAKE_LEADS = 'take_leads',
  CONSECUTIVE_COMPLETIONS = 'consecutive_completions',
  NO_CANCELLATIONS = 'no_cancellations',
  GET_REVIEWS = 'get_reviews',
  CUSTOM = 'custom',
}

export enum MinPlan {
  STARTER = 'starter',
  NORMAL = 'normal',
  PREMIUM = 'premium',
}

@Entity('mission_templates')
export class MissionTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  icon: string | null;

  @Column({ type: 'enum', enum: MissionType })
  missionType: MissionType;

  @Column({ type: 'json' })
  targetCondition: { targetValue: number };

  @Column({ type: 'json', nullable: true })
  reward: { xp?: number; walletCreditMXN?: number; boostHours?: number } | null;

  @Column({ type: 'enum', enum: MinPlan, default: MinPlan.STARTER })
  minPlan: MinPlan;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
