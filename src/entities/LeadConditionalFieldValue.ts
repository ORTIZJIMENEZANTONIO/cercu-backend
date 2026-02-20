import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Lead } from './Lead';
import { CategoryConditionalField } from './CategoryConditionalField';

@Entity('lead_conditional_field_values')
export class LeadConditionalFieldValue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  leadId: number;

  @ManyToOne(() => Lead, (lead) => lead.conditionalFieldValues)
  @JoinColumn({ name: 'leadId' })
  lead: Lead;

  @Column()
  conditionalFieldId: number;

  @ManyToOne(() => CategoryConditionalField)
  @JoinColumn({ name: 'conditionalFieldId' })
  conditionalField: CategoryConditionalField;

  @Column({ type: 'text' })
  value: string;
}