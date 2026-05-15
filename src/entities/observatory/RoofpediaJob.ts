import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum RoofpediaJobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  DONE = 'done',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Job de procesamiento Roofpedia (escaneo CNN de una alcaldía).
 * Solo 1 job con status='running' permitido a la vez (constraint vía service).
 */
@Entity('obs_roofpedia_jobs')
@Index(['observatory', 'status'])
export class RoofpediaJob {
  @PrimaryGeneratedColumn()
  id!: number;

  /** UUID público (expuesto al cliente; el `id` numérico es interno). */
  @Column({ type: 'varchar', length: 36, unique: true })
  publicId!: string;

  @Column({ type: 'varchar', length: 50 })
  observatory!: string; // 'techos-verdes'

  /** slug URL-safe de la alcaldía (ej. 'coyoacan'). */
  @Column({ type: 'varchar', length: 80 })
  alcaldiaSlug!: string;

  /** Nombre canónico de la alcaldía (ej. 'Coyoacán'). */
  @Column({ type: 'varchar', length: 120 })
  alcaldiaNombre!: string;

  @Column({ type: 'varchar', length: 20, default: RoofpediaJobStatus.PENDING })
  status!: RoofpediaJobStatus;

  /** ObservatoryAdmin.id de quien disparó el job. */
  @Column({ type: 'varchar', length: 36 })
  requestedBy!: string;

  /** Costo estimado (USD) que se mostró al confirmar — para auditoría. */
  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  costEstimateUsd!: number;

  /** PID del subprocess Python (cuando running). */
  @Column({ type: 'int', nullable: true })
  pid!: number | null;

  /** Path absoluto en el servidor al archivo de log (stdout/stderr). */
  @Column({ type: 'varchar', length: 255, nullable: true })
  logPath!: string | null;

  /** Mensaje de error si status='failed'. Truncado a 500 chars. */
  @Column({ type: 'varchar', length: 500, nullable: true })
  errorMessage!: string | null;

  /** Cuándo arrancó el subprocess (después del enqueue). */
  @Column({ type: 'datetime', nullable: true })
  startedAt!: Date | null;

  /** Cuándo terminó (success o failure). */
  @Column({ type: 'datetime', nullable: true })
  finishedAt!: Date | null;

  /** Resultados del scan (tiles descargados, detecciones, etc.) cuando done. */
  @Column({ type: 'json', nullable: true })
  result!: Record<string, any> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
