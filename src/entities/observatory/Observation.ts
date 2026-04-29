import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('obs_observations')
export class ObsObservation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: true })
  @Index()
  reefId!: number | null;

  @Column({ type: 'varchar', length: 40 })
  @Index()
  type!: string; // satellite_image | drone_flight | underwater_photo | transect_survey | water_sample | community_report | socioenvironmental_conflict

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'int' })
  @Index()
  contributorId!: number;

  @Column({ type: 'datetime' })
  capturedAt!: Date;

  @Column({ type: 'datetime' })
  submittedAt!: Date;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  lat!: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  lng!: number;

  @Column({ type: 'json', nullable: true })
  attachments!: any[] | null;

  @Column({ type: 'json', nullable: true })
  tags!: string[] | null;

  @Column({ type: 'varchar', length: 30, default: 'pending' })
  @Index()
  status!: string; // pending | in_review | validated | rejected | needs_more_info

  @Column({ type: 'varchar', length: 36, nullable: true })
  reviewerId!: string | null;

  @Column({ type: 'text', nullable: true })
  reviewerNotes!: string | null;

  @Column({ type: 'datetime', nullable: true })
  validatedAt!: Date | null;

  @Column({ type: 'int', nullable: true })
  qualityScore!: number | null;

  @Column({ type: 'boolean', default: true })
  visible!: boolean;

  @Column({ type: 'boolean', default: false })
  archived!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
