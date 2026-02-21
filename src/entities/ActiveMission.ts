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
import { MissionTemplate } from './MissionTemplate';

export enum MissionStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

@Entity('active_missions')
@Index('idx_active_missions_user_status', ['userId', 'status'])
export class ActiveMission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'int' })
  missionTemplateId: number;

  @ManyToOne(() => MissionTemplate)
  @JoinColumn({ name: 'missionTemplateId' })
  missionTemplate: MissionTemplate;

  @Column({ type: 'enum', enum: MissionStatus, default: MissionStatus.IN_PROGRESS })
  status: MissionStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  currentProgress: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  targetValue: number;

  @Column({ type: 'datetime' })
  weekStart: Date;

  @Column({ type: 'datetime' })
  weekEnd: Date;

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
