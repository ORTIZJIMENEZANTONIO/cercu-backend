import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Construcción candidata a invasión de área federal costera.
 *
 * Detectadas automáticamente por `coastalIntrusion.service.ts`:
 *   1. Genera buffer ZOFEMAT (20 m desde línea de costa OSM) por arrecife.
 *   2. Query OSM Overpass para edificios en bbox.
 *   3. Intersect con Turf.js → si toca el buffer es candidato.
 *
 * Status workflow:
 *   candidate (default desde detector)
 *      → verified  (admin confirma intrusión)
 *      → dismissed (admin descarta: estructura legal, falso positivo, etc.)
 *      → escalated (admin la promueve a `ObsConflict`; ahí sigue como caso documentado)
 *
 * Visibilidad: por ahora admin-only. La entidad NO se expone en endpoints
 * públicos hasta que sean revisadas y promovidas a `ObsConflict`.
 */
@Entity('obs_coastal_intrusions')
@Index(['reefId', 'status'])
export class ObsCoastalIntrusion {
  @PrimaryGeneratedColumn()
  id!: number;

  // El arrecife asociado (nullable si la detección queda fuera de bbox de
  // cualquier reef, lo cual normalmente no debe pasar).
  @Column({ type: 'int', nullable: true })
  reefId!: number | null;

  // Identificador OSM `way/12345` cuando viene de Overpass; permite
  // deduplicar entre corridas.
  @Column({ type: 'varchar', length: 64, nullable: true })
  osmId!: string | null;

  // Tags OSM completos (building, name, operator, etc.) — útil para que el
  // admin entienda qué es la estructura sin abrir OSM.
  @Column({ type: 'json', nullable: true })
  osmTags!: Record<string, string> | null;

  // Polígono GeoJSON del footprint detectado.
  @Column({ type: 'json' })
  geometry!: { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown };

  // Centroide para queries rápidas + posicionar marker en el mapa.
  @Column({ type: 'decimal', precision: 10, scale: 7 })
  centroidLat!: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  centroidLng!: number;

  // Superficie en metros cuadrados (Turf.area).
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  areaM2!: number | null;

  // Métrica indicativa: qué tan dentro del buffer ZOFEMAT cae el footprint.
  // 0 = el footprint sale del buffer; mayor = más invasión hacia tierra.
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  zofematOverlapPct!: number | null;

  @Column({ type: 'varchar', length: 32 })
  @Index()
  status!: string; // candidate | verified | dismissed | escalated

  @Column({ type: 'varchar', length: 32, default: 'osm_buffer_zofemat' })
  source!: string; // origen del detector (versión del algoritmo)

  @Column({ type: 'datetime' })
  detectedAt!: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reviewedBy!: string | null;

  @Column({ type: 'datetime', nullable: true })
  reviewedAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  reviewerNotes!: string | null;

  // Si el admin promueve a conflicto, guardamos el id para mostrar el link.
  @Column({ type: 'int', nullable: true })
  escalatedConflictId!: number | null;

  // ── Fase 2: detección de cambio temporal vía NDBI Sentinel-2 ──
  // NULL = aún no analizada. Cuando el admin pide "analizar novedad",
  // se llenan los seis campos con NDBI en dos epochs y un score derivado.
  @Column({ type: 'decimal', precision: 6, scale: 4, nullable: true })
  ndbiBaseline!: number | null;

  @Column({ type: 'decimal', precision: 6, scale: 4, nullable: true })
  ndbiCurrent!: number | null;

  @Column({ type: 'decimal', precision: 6, scale: 4, nullable: true })
  ndbiDelta!: number | null;

  // 0-100. Score derivado de baseline+delta:
  //   - baseline > 0   → ya construido en el epoch antiguo: score bajo
  //   - baseline < 0 y delta grande → construcción nueva: score alto
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  noveltyScore!: number | null;

  @Column({ type: 'datetime', nullable: true })
  noveltyAnalyzedAt!: Date | null;

  @Column({ type: 'json', nullable: true })
  noveltyEpochs!: { baseline: string; current: string } | null;

  // ── Fase 3: NDVI corroborativo + muestreo polígono completo + serie temporal ──
  // NDVI mide vegetación: si NDBI sube y NDVI baja, es construcción genuina
  // (se removió vegetación). Si NDBI sube pero NDVI no se mueve, es sospechoso
  // (artefacto de imagery o cambio menor sin clearing).
  @Column({ type: 'decimal', precision: 6, scale: 4, nullable: true })
  ndviBaseline!: number | null;

  @Column({ type: 'decimal', precision: 6, scale: 4, nullable: true })
  ndviCurrent!: number | null;

  @Column({ type: 'decimal', precision: 6, scale: 4, nullable: true })
  ndviDelta!: number | null;

  // 'point' (Fase 2 legacy) | 'polygon' (Fase 3 — agrega sobre todo el footprint).
  @Column({ type: 'varchar', length: 16, nullable: true })
  samplingMethod!: string | null;

  // Serie temporal anual (opt-in). Cada entry es la mediana imagery sobre el
  // polígono del footprint en el año.
  @Column({ type: 'json', nullable: true })
  noveltyTimeSeries!: Array<{ year: number; ndbi: number | null; ndvi: number | null }> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
