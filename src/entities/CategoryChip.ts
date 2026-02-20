import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Category } from './Category';

@Entity('category_chips')
export class CategoryChip {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  categoryId: number;

  @ManyToOne(() => Category, (category) => category.chips)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ type: 'varchar', length: 100 })
  label: string;

  @Column({ type: 'varchar', length: 100 })
  slug: string;

  @Column({ default: 0 })
  sortOrder: number;
}