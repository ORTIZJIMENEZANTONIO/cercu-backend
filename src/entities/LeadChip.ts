import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Lead } from './Lead';
import { CategoryChip } from './CategoryChip';

@Entity('lead_chips')
export class LeadChip {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  leadId: number;

  @ManyToOne(() => Lead, (lead) => lead.chips)
  @JoinColumn({ name: 'leadId' })
  lead: Lead;

  @Column()
  categoryChipId: number;

  @ManyToOne(() => CategoryChip)
  @JoinColumn({ name: 'categoryChipId' })
  categoryChip: CategoryChip;
}