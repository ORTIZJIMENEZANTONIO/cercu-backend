import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

// Contribuyentes del Observatorio de Techos Verdes: vecinas/os que reportan
// azoteas, profesionales (arquitectos, ingenieros) que caracterizan,
// instituciones que operan o investigan. Tabla separada para evitar
// colision de handles con los otros observatorios.
@Entity('obs_techos_verdes_contributors')
export class ObsTechosVerdesContributor {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 150 })
  displayName!: string;

  @Column({ type: 'varchar', length: 80, unique: true })
  handle!: string;

  // Roles adaptados a techos verdes:
  // ciudadano | propietario | arquitecto | ingeniero | empresa | gobierno | ong | academia
  @Column({ type: 'varchar', length: 30, default: 'ciudadano' })
  role!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  affiliation!: string | null;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  alcaldia!: string | null;

  @Column({ type: 'date', nullable: true })
  joinedAt!: string | null;

  @Column({ type: 'varchar', length: 50, default: 'aprendiz' })
  @Index()
  tier!: string;

  @Column({ type: 'int', default: 0 })
  reputationScore!: number;

  @Column({ type: 'int', default: 0 })
  validatedContributions!: number;

  @Column({ type: 'int', default: 0 })
  rejectedContributions!: number;

  @Column({ type: 'decimal', precision: 4, scale: 3, default: 0 })
  acceptanceRate!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  averageQuality!: number;

  @Column({ type: 'int', default: 0 })
  consecutiveMonthsActive!: number;

  @Column({ type: 'json', nullable: true })
  badges!: any[] | null;

  @Column({ type: 'boolean', default: true })
  publicProfile!: boolean;

  @Column({ type: 'boolean', default: false })
  verified!: boolean;

  @Column({ type: 'boolean', default: true })
  visible!: boolean;

  @Column({ type: 'boolean', default: false })
  archived!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
