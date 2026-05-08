import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  Index,
} from 'typeorm';

// Cada sección editable de cualquier observatorio. Multi-tenant via la columna
// `observatory` ('humedales' | 'arrecifes' | 'techos-verdes' | …). El par
// (observatory, pageSlug, sectionKey) es único — el upsert del servicio se
// apoya en él.
@Entity('obs_cms_sections')
@Index('idx_obs_cms_sections_lookup', ['observatory', 'pageSlug', 'sectionKey'])
export class ObsCmsSection {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50, default: 'humedales' })
  observatory!: string;

  @Column({ type: 'varchar', length: 50 })
  pageSlug!: string; // home | sobre | analisis | about | contribute | …

  @Column({ type: 'varchar', length: 50 })
  sectionKey!: string; // features | steps | tipologias | hero | sidebar | …

  @Column({ type: 'json' })
  items!: any[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  updatedBy!: string | null;

  @UpdateDateColumn()
  updatedAt!: Date;
}
