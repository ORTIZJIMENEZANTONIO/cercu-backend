import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './User';
import { ProfessionalCategory } from './ProfessionalCategory';
import { ProfessionalScheduleSlot } from './ProfessionalScheduleSlot';
import { LeadMatch } from './LeadMatch';

export enum OnboardingStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('professional_profiles')
export class ProfessionalProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  userId: string;

  @OneToOne(() => User, (user) => user.professionalProfile)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 200, nullable: true })
  businessName: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  baseLat: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  baseLng: number | null;

  @Column({ type: 'int', default: 10 })
  serviceRadiusKm: number;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ default: false })
  receiveOutsideHours: boolean;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ default: 0 })
  completedJobs: number;

  @Column({ type: 'int', default: 0 })
  avgResponseTimeMinutes: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  acceptanceRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  cancellationRate: number;

  @Column({ type: 'json', nullable: true })
  badges: string[] | null;

  @Column({ type: 'int', default: 0 })
  totalXP: number;

  @Column({ type: 'int', default: 1 })
  currentLevel: number;

  @Column({ type: 'int', default: 0 })
  consecutiveCompletions: number;

  @Column({
    type: 'enum',
    enum: OnboardingStatus,
    default: OnboardingStatus.PENDING,
  })
  onboardingStatus: OnboardingStatus;

  @OneToMany(() => ProfessionalCategory, (pc) => pc.professionalProfile, { cascade: true })
  categories: ProfessionalCategory[];

  @OneToMany(() => ProfessionalScheduleSlot, (slot) => slot.professionalProfile, { cascade: true })
  scheduleSlots: ProfessionalScheduleSlot[];

  @OneToMany(() => LeadMatch, (match) => match.professionalProfile)
  leadMatches: LeadMatch[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}