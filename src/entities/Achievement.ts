import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AchievementTriggerType {
  COMPLETED_JOBS_COUNT = 'completed_jobs_count',
  RATING_THRESHOLD = 'rating_threshold',
  AVG_RESPONSE_TIME = 'avg_response_time',
  CONSECUTIVE_COMPLETIONS = 'consecutive_completions',
  DAYS_ON_PLATFORM = 'days_on_platform',
  PHONE_VERIFIED = 'phone_verified',
  ADDRESS_SAVED = 'address_saved',
  FIRST_SERVICE = 'first_service',
  SERVICES_COMPLETED = 'services_completed',
  REVIEW_GIVEN = 'review_given',
  PHOTO_UPLOADED = 'photo_uploaded',
  DESCRIPTION_QUALITY = 'description_quality',
  NO_LATE_CANCELLATIONS = 'no_late_cancellations',
  FAST_RESPONSE = 'fast_response',
  LEADS_TAKEN = 'leads_taken',
  CUSTOM = 'custom',
}

export enum AchievementTarget {
  USER = 'user',
  PRO = 'pro',
  BOTH = 'both',
}

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  icon: string | null;

  @Column({ type: 'enum', enum: AchievementTriggerType })
  triggerType: AchievementTriggerType;

  @Column({ type: 'json' })
  triggerCondition: { value: number };

  @Column({ type: 'json', nullable: true })
  reward: { xp?: number; walletCreditMXN?: number; boostHours?: number; badge?: string } | null;

  @Column({ type: 'enum', enum: AchievementTarget, default: AchievementTarget.PRO })
  target: AchievementTarget;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
