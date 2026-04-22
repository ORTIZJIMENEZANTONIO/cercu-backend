import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('obs_candidate_roofs')
export class ObsCandidateRoof {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  nombre!: string;

  @Column({ type: 'varchar', length: 100 })
  alcaldia!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  direccion!: string | null;

  @Column({ type: 'varchar', length: 100 })
  tipoEdificio!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  superficie!: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  scoreAptitud!: number;

  @Column({ type: 'varchar', length: 50, default: 'candidato' })
  estatus!: string; // candidato | validado_visualmente | factibilidad_pendiente | piloto | implementado

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  lat!: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  lng!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imagen!: string | null;

  @Column({ type: 'json', nullable: true })
  variables!: Record<string, number> | null; // 8 AHP variables

  @Column({ type: 'varchar', length: 20, nullable: true })
  confianzaIA!: string | null; // alta | media | baja

  @Column({ type: 'date', nullable: true })
  fechaPriorizacion!: string | null;

  @Column({ type: 'boolean', default: true })
  visible!: boolean;

  @Column({ type: 'boolean', default: false })
  archivado!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
