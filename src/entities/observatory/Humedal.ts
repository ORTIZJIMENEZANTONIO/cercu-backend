import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('obs_humedales')
export class ObsHumedal {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  nombre!: string;

  @Column({ type: 'varchar', length: 100 })
  alcaldia!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ubicacion!: string | null;

  @Column({ type: 'varchar', length: 50 })
  tipoHumedal!: string; // ha_fws | ha_sfs_horizontal | ha_sfs_vertical | ha_hibrido

  @Column({ type: 'text', nullable: true })
  funcionPrincipal!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  fuente!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fuenteImagen!: string | null;

  @Column({ type: 'json', nullable: true })
  tipoVegetacion!: string[] | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  superficie!: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  volumen!: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  capacidadTratamiento!: string | null;

  @Column({ type: 'varchar', length: 20 })
  anioImplementacion!: string;

  @Column({ type: 'json', nullable: true })
  vegetacion!: string[] | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sustrato!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  usoAgua!: string | null;

  @Column({ type: 'json', nullable: true })
  serviciosEcosistemicos!: string[] | null;

  @Column({ type: 'json', nullable: true })
  serviciosDescripcion!: string[] | null;

  @Column({ type: 'text', nullable: true })
  monitoreo!: string | null;

  @Column({ type: 'varchar', length: 50, default: 'activo' })
  estado!: string; // activo | en_construccion | en_expansion | piloto

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  lat!: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  lng!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imagen!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
