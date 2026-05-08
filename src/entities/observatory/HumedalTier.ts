import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// Escala reputacional / modos de participacion del Observatorio de Humedales.
// Tabla separada de obs_tiers (que pertenece a arrecifes) para no interferir con
// los slugs/labels de ese observatorio. El slug ('aprendiz', 'observador'...) es
// la clave estable usada por HumedalContributor.tier para referenciar la escala.
@Entity('obs_humedales_tiers')
export class ObsHumedalTier {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 100 })
  label!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'int', default: 0 })
  minScore!: number;

  @Column({ type: 'int', nullable: true })
  maxScore!: number | null;

  // Token de color del design system (primary | eco | accent | secondary | slate | ...).
  @Column({ type: 'varchar', length: 30, default: 'slate' })
  color!: string;

  // Requisitos visibles (mostrados en la pagina publica). Texto libre.
  @Column({ type: 'text', nullable: true })
  requirements!: string | null;

  // Icono lucide opcional (lucide:medal, lucide:droplets, etc.).
  @Column({ type: 'varchar', length: 100, nullable: true })
  icon!: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ type: 'boolean', default: true })
  visible!: boolean;

  @Column({ type: 'boolean', default: false })
  archived!: boolean;

  // Modo de participacion: cada tier presenta una forma DISTINTA de aportar
  // (no un nivel a alcanzar). Visible en la pagina publica /contributors.
  @Column({ type: 'varchar', length: 150, nullable: true })
  modeTitle!: string | null;

  @Column({ type: 'text', nullable: true })
  audience!: string | null;

  @Column({ type: 'json', nullable: true })
  contributions!: string[] | null;

  @Column({ type: 'text', nullable: true })
  bridge!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
