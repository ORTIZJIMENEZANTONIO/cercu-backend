import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProfessionalProfile } from './ProfessionalProfile';

@Entity('professional_schedule_slots')
export class ProfessionalScheduleSlot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  professionalProfileId: number;

  @ManyToOne(() => ProfessionalProfile, (profile) => profile.scheduleSlots)
  @JoinColumn({ name: 'professionalProfileId' })
  professionalProfile: ProfessionalProfile;

  @Column({ type: 'tinyint' })
  dayOfWeek: number; // 0=Sunday, 6=Saturday

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;
}