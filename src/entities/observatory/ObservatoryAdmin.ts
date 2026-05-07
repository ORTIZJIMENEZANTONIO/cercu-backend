import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('observatory_admins')
export class ObservatoryAdmin {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'simple-array' })
  observatories!: string[]; // ['techos-verdes', 'humedales']

  @Column({ type: 'varchar', length: 20, default: 'superadmin' })
  role!: string; // superadmin | admin | editor

  @Column({ type: 'json', nullable: true })
  permissions!: string[] | null; // manage_users | manage_cms | manage_humedales | manage_hallazgos | manage_notihumedal | manage_prospectos

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'datetime', nullable: true })
  lastLogin!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
