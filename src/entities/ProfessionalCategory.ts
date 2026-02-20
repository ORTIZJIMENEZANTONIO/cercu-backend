import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProfessionalProfile } from './ProfessionalProfile';
import { Category } from './Category';

@Entity('professional_categories')
export class ProfessionalCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  professionalProfileId: number;

  @ManyToOne(() => ProfessionalProfile, (profile) => profile.categories)
  @JoinColumn({ name: 'professionalProfileId' })
  professionalProfile: ProfessionalProfile;

  @Column()
  categoryId: number;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'categoryId' })
  category: Category;
}