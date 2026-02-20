import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';

export enum AdminActionType {
  BLOCK_USER = 'block_user',
  UNBLOCK_USER = 'unblock_user',
  FLAG_USER = 'flag_user',
  UNFLAG_USER = 'unflag_user',
  APPROVE_PROFESSIONAL = 'approve_professional',
  REJECT_PROFESSIONAL = 'reject_professional',
  SUSPEND_PROFESSIONAL = 'suspend_professional',
  CANCEL_LEAD = 'cancel_lead',
  REFUND_LEAD = 'refund_lead',
  WALLET_ADJUSTMENT = 'wallet_adjustment',
}

@Entity('admin_actions')
export class AdminAction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  adminUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'adminUserId' })
  adminUser: User;

  @Column({ type: 'enum', enum: AdminActionType })
  actionType: AdminActionType;

  @Column({ type: 'uuid', nullable: true })
  targetUserId: string | null;

  @Column({ type: 'int', nullable: true })
  targetLeadId: number | null;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;
}