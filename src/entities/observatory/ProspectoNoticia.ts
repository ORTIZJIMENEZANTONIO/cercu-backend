import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('obs_prospecto_noticias')
export class ObsProspectoNoticia {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  titulo!: string;

  @Column({ type: 'text' })
  resumen!: string;

  @Column({ type: 'varchar', length: 500 })
  url!: string;

  @Column({ type: 'varchar', length: 100 })
  fuente!: string;

  @Column({ type: 'varchar', length: 20 })
  fecha!: string;

  @Column({ type: 'varchar', length: 50, default: 'pendiente' })
  estado!: string; // pendiente | aprobado | rechazado

  @Column({ type: 'text', nullable: true })
  notasRechazo!: string | null;

  @Column({ type: 'varchar', length: 64, unique: true })
  urlHash!: string; // SHA-256 of normalized URL for deduplication

  @Column({ type: 'varchar', length: 100, nullable: true })
  reviewedBy!: string | null;

  @CreateDateColumn()
  fechaScraping!: Date;
}
