import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// Escala de reputación de la red de colaboradores (Bronce / Plata / Oro / Platino / Coral...).
// El slug ('bronze', 'silver', 'gold'...) es la clave estable usada por
// `Contributor.tier` para referenciar la escala vigente.
@Entity('obs_tiers')
export class ObsTier {
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

  // Token de color del design system (amber|slate|yellow|cyan|coral|...).
  @Column({ type: 'varchar', length: 30, default: 'slate' })
  color!: string;

  // Requisitos visibles (mostrados en /contributors). Texto libre o lista.
  @Column({ type: 'text', nullable: true })
  requirements!: string | null;

  // Icono lucide opcional.
  @Column({ type: 'varchar', length: 100, nullable: true })
  icon!: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ type: 'boolean', default: true })
  visible!: boolean;

  @Column({ type: 'boolean', default: false })
  archived!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
