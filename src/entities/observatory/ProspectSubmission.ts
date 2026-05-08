import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum ProspectStatus {
  PENDIENTE = 'pendiente',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado',
}

export enum ProspectSource {
  IA_DETECTOR = 'ia_detector',
  MANUAL = 'manual',
  EXTERNO = 'externo',
}

@Entity('obs_prospect_submissions')
export class ProspectSubmission {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50 })
  observatory!: string; // 'techos-verdes' | 'humedales'

  @Column({ type: 'varchar', length: 50, default: ProspectStatus.PENDIENTE })
  status!: string;

  @Column({ type: 'json' })
  data!: Record<string, any>; // Full prospect payload (flexible)

  @Column({ type: 'varchar', length: 100, nullable: true })
  source!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  confianzaDetector!: string | null;

  @Column({ type: 'text', nullable: true })
  notasAdmin!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reviewedBy!: string | null;

  @Column({ type: 'datetime', nullable: true })
  reviewedAt!: Date | null;

  // Atribucion: contribuyente al que se asocia el reporte (opcional).
  // Para humedales referencia obs_humedales_contributors.id;
  // para techos-verdes esta sin uso por ahora.
  @Column({ type: 'int', nullable: true })
  contributorId!: number | null;

  @CreateDateColumn()
  createdAt!: Date;
}
