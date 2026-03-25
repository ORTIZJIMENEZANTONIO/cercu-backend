import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('guardianes_events')
export class GuardianesEvent {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ length: 50 })
  eventId!: string;

  @Index()
  @Column({ length: 30 })
  type!: string;

  @Column({ type: 'bigint' })
  timestamp!: number;

  @Index()
  @Column({ length: 30 })
  playerId!: string;

  @Column({ type: 'json', nullable: true })
  data!: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;
}
