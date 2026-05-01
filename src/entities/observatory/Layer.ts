import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

// Capa de datos abierta del Observatorio de Arrecifes.
// kind = 'external_url' → sólo metadata + sourceUrl/wmsUrl (NOAA/NASA/CONABIO/...).
// kind = 'uploaded_file' → archivo binario en disco (uploads/layers/) + filePath/fileName.
@Entity('obs_layers')
export class ObsLayer {
  @PrimaryGeneratedColumn()
  id!: number;

  // Slug estable usado por el frontend (ej. 'noaa-crw-dhw-5km').
  @Column({ type: 'varchar', length: 100, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  // Origen del binario / metadata.
  @Column({ type: 'varchar', length: 20, default: 'external_url' })
  @Index()
  kind!: 'external_url' | 'uploaded_file';

  // Catálogo (idéntico a DataLayer del frontend).
  @Column({ type: 'varchar', length: 50 })
  provider!: string;

  @Column({ type: 'varchar', length: 100 })
  providerLabel!: string;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  category!: string; // thermal_stress | bathymetry | benthic_habitat | ...

  @Column({ type: 'varchar', length: 20 })
  format!: string; // wms | wmts | geotiff | shapefile | geojson | kml | csv | cog

  @Column({ type: 'varchar', length: 50, nullable: true })
  resolution!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  cadence!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'regional' })
  coverage!: 'global' | 'regional' | 'national';

  @Column({ type: 'varchar', length: 100 })
  license!: string;

  @Column({ type: 'text' })
  attribution!: string;

  // URLs externas del proveedor (siempre que aplique).
  @Column({ type: 'text', nullable: true })
  sourceUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  downloadUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  previewUrl!: string | null;

  // Render WMS / tile en el mapa (opcional).
  @Column({ type: 'text', nullable: true })
  wmsUrl!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  wmsLayerName!: string | null;

  @Column({ type: 'text', nullable: true })
  tileUrlPattern!: string | null;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.7 })
  overlayOpacity!: number;

  // Archivo subido (si kind = 'uploaded_file').
  @Column({ type: 'varchar', length: 255, nullable: true })
  fileName!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  filePath!: string | null; // relativo a uploads/, ej. 'layers/uuid.geojson'

  @Column({ type: 'bigint', nullable: true })
  fileSize!: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mimeType!: string | null;

  @Column({ type: 'date', nullable: true })
  lastUpdated!: string | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ type: 'boolean', default: true })
  visible!: boolean;

  @Column({ type: 'boolean', default: false })
  archived!: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
