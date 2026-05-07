import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Snapshot histórico de los indicadores de un arrecife. Permite construir
 * series de tiempo para tendencias, Mann-Kendall, forecasts y evolución del
 * Índice de Salud Coralino (CHI). Una fila por (reefId, capturedAt).
 *
 * `capturedAt` se almacena en UTC con resolución de fecha (date) para que el
 * upsert del snapshot manual no dispare múltiples filas por día.
 */
@Entity('obs_reef_metric_snapshots')
@Index(['reefId', 'capturedAt'])
export class ObsReefMetricSnapshot {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  reefId!: number;

  @Column({ type: 'date' })
  capturedAt!: string; // YYYY-MM-DD

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  liveCoralCover!: number | null; // %

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  dhw!: number | null; // °C·semanas

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  sst!: number | null; // °C

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  sstAnomaly!: number | null; // °C

  @Column({ type: 'int', default: 0 })
  observationsCount!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  healthIndex!: number | null; // 0-100, computado server-side

  @Column({ type: 'varchar', length: 16, default: 'manual' })
  source!: string; // manual | cron | seed

  @CreateDateColumn()
  createdAt!: Date;
}
