import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('obs_conflicts')
export class ObsConflict {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  summary!: string;

  @Column({ type: 'longtext', nullable: true })
  fullStory!: string | null;

  @Column({ type: 'json', nullable: true })
  reefIds!: number[] | null;

  @Column({ type: 'varchar', length: 100 })
  state!: string;

  @Column({ type: 'json', nullable: true })
  threats!: string[] | null;

  @Column({ type: 'varchar', length: 20, default: 'medium' })
  @Index()
  intensity!: string; // low | medium | high | critical

  @Column({ type: 'varchar', length: 20, default: 'ongoing' })
  @Index()
  status!: string; // emerging | ongoing | mitigating | resolved

  @Column({ type: 'json', nullable: true })
  affectedCommunities!: string[] | null;

  @Column({ type: 'json', nullable: true })
  affectedSpecies!: string[] | null;

  @Column({ type: 'date', nullable: true })
  startedAt!: string | null;

  @Column({ type: 'json', nullable: true })
  drivers!: string[] | null;

  @Column({ type: 'json', nullable: true })
  resistance!: string[] | null;

  @Column({ type: 'json', nullable: true })
  legalActions!: string[] | null;

  @Column({ type: 'json', nullable: true })
  mediaUrls!: string[] | null;

  @Column({ type: 'int', nullable: true })
  contributorId!: number | null;

  @Column({ type: 'boolean', default: true })
  visible!: boolean;

  @Column({ type: 'boolean', default: false })
  archived!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
