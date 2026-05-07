import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Artículo de noticias del observatorio de arrecifes. Editorial / curado por
 * el equipo. Convención inglesa para identificadores (camelCase) consistente
 * con el resto del módulo arrecifes (a diferencia de `obs_notihumedal` que es
 * en español).
 */
@Entity('obs_reef_news')
export class ObsReefNews {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug!: string;

  @Column({ type: 'text' })
  summary!: string;

  @Column({ type: 'longtext', nullable: true })
  content!: string | null;

  @Column({ type: 'varchar', length: 150 })
  author!: string;

  @Column({ type: 'varchar', length: 20 })
  publishedAt!: string; // YYYY-MM-DD

  @Column({ type: 'json', nullable: true })
  tags!: string[] | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  imageCredit!: string | null;

  // Atribución obligatoria al autor original cuando viene de un prospecto
  // scrapeado. `sourceUrl` permite linkear de vuelta; `source` es la etiqueta
  // visible (ej. "Mongabay Latam").
  @Column({ type: 'varchar', length: 500, nullable: true })
  sourceUrl!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  source!: string | null;

  @Column({ type: 'boolean', default: true })
  visible!: boolean;

  @Column({ type: 'boolean', default: false })
  archived!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
