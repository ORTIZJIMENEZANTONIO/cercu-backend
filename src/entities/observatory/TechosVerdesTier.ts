import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// Escala reputacional / modos de participacion del Observatorio de Techos Verdes.
// Tabla separada de obs_tiers (arrecifes) y obs_humedales_tiers para que cada
// observatorio tenga su propio vocabulario sin colisiones de slug.
@Entity('obs_techos_verdes_tiers')
export class ObsTechosVerdesTier {
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

  // Token de color del design system (eco | primary | secondary | accent | slate | ...).
  @Column({ type: 'varchar', length: 30, default: 'slate' })
  color!: string;

  @Column({ type: 'text', nullable: true })
  requirements!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  icon!: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ type: 'boolean', default: true })
  visible!: boolean;

  @Column({ type: 'boolean', default: false })
  archived!: boolean;

  // Modo de participacion (visible en pagina publica /contributors).
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
