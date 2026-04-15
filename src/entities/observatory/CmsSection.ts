import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('obs_cms_sections')
export class ObsCmsSection {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50 })
  pageSlug!: string; // home | sobre | analisis

  @Column({ type: 'varchar', length: 50 })
  sectionKey!: string; // features | steps | tipologias | etc.

  @Column({ type: 'json' })
  items!: any[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  updatedBy!: string | null;

  @UpdateDateColumn()
  updatedAt!: Date;
}
