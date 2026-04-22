import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('obs_hallazgos')
export class ObsHallazgo {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  titulo!: string;

  @Column({ type: 'text' })
  descripcion!: string;

  @Column({ type: 'json', nullable: true })
  evidencia!: string[] | null;

  @Column({ type: 'varchar', length: 20 })
  impacto!: string; // alto | medio | critico

  @Column({ type: 'json' })
  recomendacion!: {
    titulo: string;
    descripcion: string;
    acciones?: string[];
    responsables?: string[];
    plazo: string;
    costoEstimado?: string;
  };

  @Column({ type: 'boolean', default: true })
  visible!: boolean;

  @Column({ type: 'boolean', default: false })
  archivado!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
