import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';

export enum ReportTargetType {
  USER = 'user',
  PROFESSIONAL = 'professional',
  LEAD = 'lead',
}

export enum ReportReason {
  INAPPROPRIATE_BEHAVIOR = 'inappropriate_behavior',
  SPAM = 'spam',
  FRAUD = 'fraud',
  FALSE_INFORMATION = 'false_information',
  NO_SHOW = 'no_show',
  HARASSMENT = 'harassment',
  OTHER = 'other',
}

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  reporterUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reporterUserId' })
  reporterUser: User;

  @Column({ type: 'enum', enum: ReportTargetType })
  targetType: ReportTargetType;

  @Column({ type: 'uuid', nullable: true })
  targetUserId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'targetUserId' })
  targetUser: User | null;

  @Column({ type: 'int', nullable: true })
  targetLeadId: number | null;

  @Column({ type: 'enum', enum: ReportReason })
  reason: ReportReason;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.PENDING })
  status: ReportStatus;

  @Column({ type: 'text', nullable: true })
  adminNotes: string | null;

  @Column({ type: 'datetime', nullable: true })
  resolvedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
