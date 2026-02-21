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
  CREATE_PLAN = 'create_plan',
  UPDATE_PLAN = 'update_plan',
  DELETE_PLAN = 'delete_plan',
  UPDATE_CONFIG_KV = 'update_config_kv',
  DELETE_CONFIG_KV = 'delete_config_kv',
  CREATE_BOOST_TYPE = 'create_boost_type',
  UPDATE_BOOST_TYPE = 'update_boost_type',
  DELETE_BOOST_TYPE = 'delete_boost_type',
  CREATE_LEVEL = 'create_level',
  UPDATE_LEVEL = 'update_level',
  DELETE_LEVEL = 'delete_level',
  CREATE_ACHIEVEMENT = 'create_achievement',
  UPDATE_ACHIEVEMENT = 'update_achievement',
  DELETE_ACHIEVEMENT = 'delete_achievement',
  CREATE_MISSION_TEMPLATE = 'create_mission_template',
  UPDATE_MISSION_TEMPLATE = 'update_mission_template',
  DELETE_MISSION_TEMPLATE = 'delete_mission_template',
  GRANT_XP = 'grant_xp',
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
