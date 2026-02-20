import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Lead } from './Lead';
import { ProfessionalProfile } from './ProfessionalProfile';

export enum MatchStatus {
  PENDING = 'pending',
  NOTIFIED = 'notified',
  VIEWED = 'viewed',
  TAKEN = 'taken',
  DECLINED = 'declined',
  EXPIRED = 'expired',
}

@Entity('lead_matches')
export class LeadMatch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  leadId: number;

  @ManyToOne(() => Lead, (lead) => lead.matches)
  @JoinColumn({ name: 'leadId' })
  lead: Lead;

  @Column()
  professionalProfileId: number;

  @ManyToOne(() => ProfessionalProfile, (profile) => profile.leadMatches)
  @JoinColumn({ name: 'professionalProfileId' })
  professionalProfile: ProfessionalProfile;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  score: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  distanceKm: number;

  @Column({ type: 'enum', enum: MatchStatus, default: MatchStatus.PENDING })
  status: MatchStatus;

  @CreateDateColumn()
  createdAt: Date;
}
