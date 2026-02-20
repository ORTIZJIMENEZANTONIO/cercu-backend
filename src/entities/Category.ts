import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { CategoryChip } from './CategoryChip';
import { CategoryConditionalField } from './CategoryConditionalField';
import { CategoryPricing } from './CategoryPricing';

export enum CategoryType {
  EMERGENCY = 'emergency',
  PROJECT = 'project',
}

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon: string | null;

  @Column({ type: 'enum', enum: CategoryType, default: CategoryType.PROJECT })
  type: CategoryType;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => CategoryChip, (chip) => chip.category, { cascade: true })
  chips: CategoryChip[];

  @OneToMany(() => CategoryConditionalField, (field) => field.category, { cascade: true })
  conditionalFields: CategoryConditionalField[];

  @OneToMany(() => CategoryPricing, (pricing) => pricing.category, { cascade: true })
  pricing: CategoryPricing[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}