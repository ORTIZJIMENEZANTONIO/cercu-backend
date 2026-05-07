import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type InteractionEventType =
  | 'pageview'
  | 'click'
  | 'submit'
  | 'search'
  | 'filter'
  | 'download'
  | 'external_link'
  | 'custom';

@Entity('observatory_interaction_events')
@Index(['observatory', 'createdAt'])
@Index(['observatory', 'eventType', 'createdAt'])
@Index(['observatory', 'sessionId'])
export class InteractionEvent {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  @Column({ type: 'varchar', length: 32 })
  observatory!: string;

  @Column({ type: 'varchar', length: 24 })
  eventType!: InteractionEventType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  path!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  target!: string | null;

  @Column({ type: 'varchar', length: 64 })
  sessionId!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  userId!: string | null;

  @Column({ type: 'json', nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  referrer!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ipHash!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
