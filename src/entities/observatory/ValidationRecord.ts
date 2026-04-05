import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('obs_validation_records')
export class ObsValidationRecord {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: true })
  candidatoId!: number | null;

  @Column({ type: 'varchar', length: 255 })
  nombre!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imagen!: string | null;

  @Column({ type: 'text', nullable: true })
  prediccion!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  confianza!: string | null; // alta | media | baja

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  porcentajeConfianza!: number | null;

  @Column({ type: 'varchar', length: 50, default: 'pendiente' })
  estado!: string; // pendiente | confirmado | rechazado | indeterminado | pendiente_reconciliacion

  @Column({ type: 'varchar', length: 150, nullable: true })
  revisadoPor!: string | null;

  @Column({ type: 'datetime', nullable: true })
  fechaRevision!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
