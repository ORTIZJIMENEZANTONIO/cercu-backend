import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/**
 * Cola de candidatos scrapeados para noticias del observatorio de arrecifes.
 * El admin revisa y aprueba/rechaza desde `/admin/noticias` (tab Prospectos).
 * `urlHash` (SHA-256 sobre URL normalizada) garantiza deduplicación entre
 * corridas del scraper.
 */
@Entity('obs_reef_news_prospects')
export class ObsReefNewsProspect {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  summary!: string;

  @Column({ type: 'varchar', length: 500 })
  url!: string;

  @Column({ type: 'varchar', length: 100 })
  source!: string;

  @Column({ type: 'varchar', length: 20 })
  publishedAt!: string; // YYYY-MM-DD

  @Column({ type: 'varchar', length: 500, nullable: true })
  image!: string | null;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status!: string; // pending | approved | rejected

  @Column({ type: 'text', nullable: true })
  rejectionNotes!: string | null;

  @Column({ type: 'varchar', length: 64, unique: true })
  urlHash!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reviewedBy!: string | null;

  @CreateDateColumn()
  scrapedAt!: Date;
}
