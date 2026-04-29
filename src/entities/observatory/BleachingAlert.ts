import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('obs_bleaching_alerts')
@Index(['reefId', 'observedAt'])
export class ObsBleachingAlert {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  reefId!: number;

  @Column({ type: 'varchar', length: 20 })
  level!: string; // no_stress | watch | warning | alert_1 | alert_2

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  dhw!: number | null; // degree heating weeks

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  sst!: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  sstAnomaly!: number | null;

  @Column({ type: 'datetime' })
  observedAt!: Date;

  @Column({ type: 'varchar', length: 30, default: 'noaa_crw' })
  source!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  productUrl!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
