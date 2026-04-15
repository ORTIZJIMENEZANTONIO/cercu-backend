import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('obs_notihumedal')
export class ObsNotihumedal {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  titulo!: string;

  @Column({ type: 'varchar', length: 255 })
  slug!: string;

  @Column({ type: 'text' })
  resumen!: string;

  @Column({ type: 'longtext', nullable: true })
  contenido!: string | null;

  @Column({ type: 'text', nullable: true })
  css_content!: string | null;

  @Column({ type: 'json', nullable: true })
  editor_data!: Record<string, any> | null;

  @Column({ type: 'varchar', length: 150 })
  autor!: string;

  @Column({ type: 'varchar', length: 20 })
  fecha!: string;

  @Column({ type: 'json', nullable: true })
  tags!: string[] | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imagen!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
