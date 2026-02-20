import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './User';
import { Category } from './Category';
import { ProfessionalProfile } from './ProfessionalProfile';
import { LeadChip } from './LeadChip';
import { LeadConditionalFieldValue } from './LeadConditionalFieldValue';
import { LeadMatch } from './LeadMatch';
import { UrgencyTier } from './CategoryPricing';

export enum LeadStatus {
  PENDING = 'pending',
  MATCHED = 'matched',
  TAKEN = 'taken',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.leads)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  categoryId: number;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ type: 'enum', enum: UrgencyTier, default: UrgencyTier.STANDARD })
  urgencyTier: UrgencyTier;

  @Column({ type: 'enum', enum: LeadStatus, default: LeadStatus.PENDING })
  status: LeadStatus;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  lat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  lng: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string | null;

  @Column({ type: 'json', nullable: true })
  photos: string[] | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  priceMXN: number;

  @Column({ default: false })
  isQualified: boolean;

  @Column({ type: 'int', nullable: true })
  takenByProfessionalId: number | null;

  @ManyToOne(() => ProfessionalProfile, { nullable: true })
  @JoinColumn({ name: 'takenByProfessionalId' })
  takenByProfessional: ProfessionalProfile;

  @Column({ type: 'datetime', nullable: true })
  takenAt: Date | null;

  @Column({ type: 'datetime', nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  preferredSchedule: string | null;

  @OneToMany(() => LeadChip, (chip) => chip.lead, { cascade: true })
  chips: LeadChip[];

  @OneToMany(() => LeadConditionalFieldValue, (val) => val.lead, { cascade: true })
  conditionalFieldValues: LeadConditionalFieldValue[];

  @OneToMany(() => LeadMatch, (match) => match.lead, { cascade: true })
  matches: LeadMatch[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}