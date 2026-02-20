import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { ProfessionalProfile } from './ProfessionalProfile';
import { Wallet } from './Wallet';
import { Lead } from './Lead';

export enum UserRole {
  USER = 'user',
  PROFESSIONAL = 'professional',
  ADMIN = 'admin',
}

export enum AuthProvider {
  PHONE = 'phone',
  GOOGLE = 'google',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  phone: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string | null;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  googleId: string | null;

  @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.PHONE })
  authProvider: AuthProvider;

  @Column({ type: 'varchar', length: 500, nullable: true })
  profilePicture: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ default: false })
  phoneVerified: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isFlagged: boolean;

  @Column({ type: 'text', nullable: true })
  flagReason: string | null;

  @OneToOne(() => ProfessionalProfile, (profile) => profile.user)
  professionalProfile: ProfessionalProfile;

  @OneToOne(() => Wallet, (wallet) => wallet.user)
  wallet: Wallet;

  @OneToMany(() => Lead, (lead) => lead.user)
  leads: Lead[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
