import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Category } from './Category';

export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  BOOLEAN = 'boolean',
}

@Entity('category_conditional_fields')
export class CategoryConditionalField {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  categoryId: number;

  @ManyToOne(() => Category, (category) => category.conditionalFields)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ type: 'varchar', length: 100 })
  fieldKey: string;

  @Column({ type: 'varchar', length: 150 })
  label: string;

  @Column({ type: 'enum', enum: FieldType, default: FieldType.TEXT })
  fieldType: FieldType;

  @Column({ type: 'json', nullable: true })
  options: string[] | null;

  @Column({ default: false })
  required: boolean;

  @Column({ type: 'json', nullable: true })
  showWhenChipSlugs: string[] | null;
}