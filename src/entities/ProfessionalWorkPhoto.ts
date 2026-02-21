import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ProfessionalProfile } from './ProfessionalProfile';
import { Category } from './Category';

@Entity('professional_work_photos')
export class ProfessionalWorkPhoto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  professionalProfileId: number;

  @Column()
  categoryId: number;

  @Column({ type: 'varchar', length: 500 })
  url: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => ProfessionalProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'professionalProfileId' })
  profile: ProfessionalProfile;

  @ManyToOne(() => Category, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;
}
