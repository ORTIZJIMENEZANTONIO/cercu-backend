import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('pro_levels')
export class ProLevel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  level: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'int' })
  xpRequired: number;

  @Column({ type: 'int', default: 0 })
  matchScoreBonus: number;

  @Column({ type: 'json', nullable: true })
  perks: Record<string, any> | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
