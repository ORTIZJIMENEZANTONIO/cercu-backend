import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Category } from './Category';

export enum UrgencyTier {
  STANDARD = 'standard',
  TODAY = 'today',
  IMMEDIATE = 'immediate',
}

@Entity('category_pricing')
export class CategoryPricing {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  categoryId: number;

  @ManyToOne(() => Category, (category) => category.pricing)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ type: 'enum', enum: UrgencyTier })
  urgencyTier: UrgencyTier;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  priceMXN: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  qualifiedSurchargeMXN: number;
}