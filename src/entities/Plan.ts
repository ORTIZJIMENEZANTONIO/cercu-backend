import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  priceMXN: number;

  @Column({ type: 'int' })
  maxLeadsPerDay: number;

  @Column({ type: 'int', default: -1 })
  maxLeadsPerMonth: number; // -1 = unlimited

  @Column({ type: 'int', default: 0 })
  matchPriorityBoost: number;

  @Column({ type: 'int', default: 0 })
  boostSlotsIncluded: number;

  @Column({ type: 'int', default: 1 })
  maxMissionsPerWeek: number;

  @Column({ type: 'int', default: 0 })
  boostDiscountPercent: number;

  @Column({ default: false })
  priorityLeadAccess: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  profileBadge: string | null;

  @Column({ type: 'varchar', length: 20, default: 'basic' })
  analyticsLevel: string;

  @Column({ type: 'varchar', length: 20, default: 'community' })
  supportLevel: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
