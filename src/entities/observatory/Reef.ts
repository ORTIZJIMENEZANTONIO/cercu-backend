import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

// Subset de variables climatológicas anuales (medias) que pedimos a NASA POWER.
// Cubre las que tienen relevancia ecológica para arrecifes.
export interface ReefClimateData {
  source: 'nasa_power';
  lat: number;
  lng: number;
  // Promedios anuales
  solarIrradiation: number | null;   // ALLSKY_SFC_SW_DWN — kWh/m²/día
  airTemp: number | null;            // T2M — °C
  precipitation: number | null;      // PRECTOTCORR — mm/día
  windSpeed: number | null;          // WS10M — m/s
  relativeHumidity: number | null;   // RH2M — %
  // Promedios mensuales (12 valores: ene → dic)
  monthly: {
    solarIrradiation: number[];
    airTemp: number[];
    precipitation: number[];
  } | null;
}

@Entity('obs_reefs')
export class ObsReef {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  state!: string;

  @Column({ type: 'varchar', length: 30 })
  @Index()
  ocean!: string; // caribbean | gulf_of_mexico | pacific

  @Column({ type: 'varchar', length: 200, nullable: true })
  region!: string | null;

  @Column({ type: 'json', nullable: true })
  benthicClasses!: string[] | null;

  @Column({ type: 'json', nullable: true })
  geomorphicClasses!: string[] | null;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  area!: number | null; // hectares

  @Column({ type: 'json', nullable: true })
  depthRange!: [number, number] | null;

  @Column({ type: 'varchar', length: 30, default: 'unprotected' })
  protection!: string; // anp_federal | anp_state | ramsar | unesco | unprotected

  @Column({ type: 'varchar', length: 20, default: 'healthy' })
  @Index()
  status!: string; // healthy | watch | warning | alert | bleaching | mortality

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  liveCoralCover!: number | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  bleachingAlert!: string | null; // no_stress | watch | warning | alert_1 | alert_2

  @Column({ type: 'int', nullable: true })
  speciesRichness!: number | null;

  @Column({ type: 'json', nullable: true })
  threats!: string[] | null;

  @Column({ type: 'int', default: 0 })
  observations!: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  lat!: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  lng!: number;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  hero!: string | null;

  @Column({ type: 'json', nullable: true })
  gallery!: string[] | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  imageCredit!: string | null;

  @Column({ type: 'boolean', default: true })
  visible!: boolean;

  @Column({ type: 'boolean', default: false })
  archived!: boolean;

  // Climatología NASA POWER (https://power.larc.nasa.gov). Cacheada por arrecife;
  // la climatología cambia poco así que se refresca rara vez. `null` hasta que
  // se ejecuta el endpoint de refresh.
  @Column({ type: 'json', nullable: true })
  climateData!: ReefClimateData | null;

  @Column({ type: 'datetime', nullable: true })
  climateFetchedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
