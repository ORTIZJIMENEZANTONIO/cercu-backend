import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './User';

export enum ChangeStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('pending_profile_changes')
export class PendingProfileChange {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 50 })
  fieldName: string; // 'name' or 'phone'

  @Column({ type: 'varchar', length: 255, nullable: true })
  currentValue: string | null;

  @Column({ type: 'varchar', length: 255 })
  requestedValue: string;

  @Column({ type: 'enum', enum: ChangeStatus, default: ChangeStatus.PENDING })
  status: ChangeStatus;

  @Column({ type: 'text', nullable: true })
  adminNotes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
