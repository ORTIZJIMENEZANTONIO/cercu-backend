import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('obs_green_roofs')
export class ObsGreenRoof {
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

  @Column({ type: 'varchar', length: 50 })
  tipoTechoVerde!: string; // extensivo | intensivo | semi-intensivo

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  superficie!: number | null;

  @Column({ type: 'varchar', length: 50, default: 'nuevo' })
  estado!: string; // activo | mantenimiento | inactivo | nuevo

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  lat!: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  lng!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imagen!: string | null;

  @Column({ type: 'text', nullable: true })
  descripcion!: string | null;

  @Column({ type: 'date', nullable: true })
  fechaRegistro!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
