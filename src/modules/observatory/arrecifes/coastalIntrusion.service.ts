// Detector de invasión de zona federal costera (ZOFEMAT) — Fase 1.
//
// Estrategia (deliberadamente simple, sin ML):
//   1. Para cada arrecife, calcular un bbox local (~5 km radio).
//   2. Query Overpass: `way[natural=coastline]` dentro del bbox →
//      LineString de la línea de costa.
//   3. Buffer Turf de 20 m hacia tierra → polígono ZOFEMAT aproximado.
//      Este buffer ES una aproximación al concepto legal de la Zona Federal
//      Marítimo Terrestre (SEMARNAT define 20 m desde la pleamar máxima).
//      No reemplaza el polígono oficial cuando esté disponible.
//   4. Query Overpass: `way[building]` dentro del bbox.
//   5. Para cada edificio: `turf.booleanIntersects(building, zofematBuffer)`.
//      Si toca → candidato. Calcular `zofematOverlapPct` con
//      `turf.intersect / turf.area(building) * 100`.
//   6. Upsert en `obs_coastal_intrusions` por (reefId, osmId).
//
// Limitaciones honestas:
//   - OSM building coverage es desigual: cubre Cancún/Cozumel bien,
//     Banco Chinchorro mal. La cobertura es la cobertura de OSM.
//   - El buffer de 20 m simplifica la realidad legal (zona federal cambia
//     según marea y tipo de costa).
//   - No detecta cambio temporal (esa es Fase 2 con NDBI/Sentinel-2).
//   - Detectar ≠ probar invasión legal. La cola es admin-only por diseño.
import * as turf from '@turf/turf';
import { AppDataSource } from '../../../ormconfig';
import { ObsReef } from '../../../entities/observatory/Reef';
import { ObsCoastalIntrusion } from '../../../entities/observatory/CoastalIntrusion';
import { ObsConflict } from '../../../entities/observatory/Conflict';
import { AppError } from '../../../middleware/errorHandler.middleware';
import { config } from '../../../config';
import { getGEEToken } from '../../../utils/geeAuth';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const OVERPASS_TIMEOUT_MS = 30000;
const USER_AGENT =
  'ObservatorioArrecifesBot/1.0 (+https://arrecifes.cercu.com.mx)';

// Radio en grados (~5 km en latitud media) alrededor del centroide del reef.
// Suficiente para capturar la franja costera adyacente sin saturar Overpass.
const BBOX_HALF_DEG = 0.05;

// Buffer ZOFEMAT en kilómetros (20 m).
const ZOFEMAT_BUFFER_KM = 0.02;

const reefRepo = () => AppDataSource.getRepository(ObsReef);
const intrusionRepo = () => AppDataSource.getRepository(ObsCoastalIntrusion);
const conflictRepo = () => AppDataSource.getRepository(ObsConflict);

interface OverpassElement {
  type: 'way' | 'node' | 'relation';
  id: number;
  geometry?: Array<{ lat: number; lon: number }>;
  members?: Array<{
    type: string; ref: number; role: string;
    geometry?: Array<{ lat: number; lon: number }>;
  }>;
  tags?: Record<string, string>;
}

const overpassQuery = async (query: string): Promise<OverpassElement[]> => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), OVERPASS_TIMEOUT_MS);
  try {
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT,
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: ctrl.signal,
    });
    if (!res.ok) {
      throw new Error(`Overpass HTTP ${res.status}`);
    }
    const json = (await res.json()) as { elements?: OverpassElement[] };
    return json.elements || [];
  } finally {
    clearTimeout(timer);
  }
};

const reefBbox = (reef: ObsReef): [number, number, number, number] => {
  const lat = Number(reef.lat);
  const lng = Number(reef.lng);
  // [south, west, north, east]
  return [
    lat - BBOX_HALF_DEG,
    lng - BBOX_HALF_DEG,
    lat + BBOX_HALF_DEG,
    lng + BBOX_HALF_DEG,
  ];
};

// Genera polígono ZOFEMAT aproximado: union de buffers de 20 m sobre cada
// segmento de línea de costa OSM dentro del bbox del reef. Devuelve null si
// el reef no tiene línea de costa en OSM (ej. atolones offshore como
// Banco Chinchorro o Alacranes — para esos sitios la "zona federal" se rige
// por la ANP marina, no por ZOFEMAT terrestre).
const generateZofematBuffer = async (
  reef: ObsReef,
): Promise<GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> | null> => {
  const [s, w, n, e] = reefBbox(reef);
  const query = `
    [out:json][timeout:25];
    way["natural"="coastline"](${s},${w},${n},${e});
    out geom;
  `;
  const elements = await overpassQuery(query);
  if (elements.length === 0) return null;

  // Cada elemento `way` con geometry es una serie de coordenadas. Las
  // convertimos a LineString y aplicamos buffer.
  const buffered: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>[] = [];
  for (const el of elements) {
    if (!el.geometry || el.geometry.length < 2) continue;
    const coords = el.geometry.map((p) => [p.lon, p.lat]);
    const line = turf.lineString(coords);
    try {
      const buf = turf.buffer(line, ZOFEMAT_BUFFER_KM, { units: 'kilometers' });
      if (buf) buffered.push(buf as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>);
    } catch {
      // segmentos degenerados (un solo punto repetido) lanzan; los saltamos
      continue;
    }
  }

  if (buffered.length === 0) return null;
  if (buffered.length === 1) return buffered[0];

  // Unión progresiva de los buffers — Turf union acepta de a 2.
  let merged = buffered[0];
  for (let i = 1; i < buffered.length; i++) {
    try {
      const u = turf.union(
        turf.featureCollection([merged, buffered[i]]) as any,
      );
      if (u) merged = u as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
    } catch {
      continue;
    }
  }
  return merged;
};

// Convierte un way OSM con geometry a un polígono Turf cerrado.
const buildingToPolygon = (
  el: OverpassElement,
): GeoJSON.Feature<GeoJSON.Polygon> | null => {
  if (!el.geometry || el.geometry.length < 3) return null;
  const coords = el.geometry.map((p) => [p.lon, p.lat]);
  // Cierra el polígono si el primer y último punto difieren
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    coords.push([first[0], first[1]]);
  }
  if (coords.length < 4) return null;
  try {
    return turf.polygon([coords]);
  } catch {
    return null;
  }
};

interface DetectionResult {
  reefId: number;
  reefName: string;
  buildingsScanned: number;
  candidates: number;
  inserted: number;
  updated: number;
  skipped: number;
  reason?: string;
}

export const detectIntrusionsForReef = async (
  reef: ObsReef,
): Promise<DetectionResult> => {
  const result: DetectionResult = {
    reefId: reef.id,
    reefName: reef.name,
    buildingsScanned: 0,
    candidates: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
  };

  const zofemat = await generateZofematBuffer(reef);
  if (!zofemat) {
    result.reason = 'sin_costa_osm';
    return result;
  }

  const [s, w, n, e] = reefBbox(reef);
  const buildingQuery = `
    [out:json][timeout:25];
    way["building"](${s},${w},${n},${e});
    out geom tags;
  `;
  const elements = await overpassQuery(buildingQuery);
  result.buildingsScanned = elements.length;

  const detectedAt = new Date();

  for (const el of elements) {
    const poly = buildingToPolygon(el);
    if (!poly) {
      result.skipped++;
      continue;
    }

    let intersects = false;
    let overlapPct: number | null = null;
    try {
      intersects = turf.booleanIntersects(poly, zofemat);
      if (intersects) {
        const inter = turf.intersect(
          turf.featureCollection([poly, zofemat]) as any,
        );
        if (inter) {
          const a = turf.area(poly);
          const ai = turf.area(inter);
          overlapPct = a > 0 ? Math.min(100, (ai / a) * 100) : null;
        }
      }
    } catch {
      result.skipped++;
      continue;
    }

    if (!intersects) continue;
    result.candidates++;

    const osmId = `way/${el.id}`;
    const centroid = turf.centroid(poly);
    const [cLng, cLat] = centroid.geometry.coordinates;
    const areaM2 = turf.area(poly);

    // Upsert por (reefId, osmId). Si ya existe y status != candidate (admin
    // ya lo tocó), respetamos su decisión: sólo refrescamos geometría +
    // metadata sin tocar status/reviewerNotes.
    const existing = await intrusionRepo().findOne({
      where: { reefId: reef.id, osmId },
    });

    const payload: Partial<ObsCoastalIntrusion> = {
      reefId: reef.id,
      osmId,
      osmTags: el.tags || null,
      geometry: poly.geometry as any,
      centroidLat: Number(cLat.toFixed(7)),
      centroidLng: Number(cLng.toFixed(7)),
      areaM2: Math.round(areaM2 * 100) / 100,
      zofematOverlapPct: overlapPct != null ? Math.round(overlapPct * 100) / 100 : null,
      source: 'osm_buffer_zofemat',
      detectedAt,
    };

    if (existing) {
      Object.assign(existing, payload);
      // Si el admin ya lo había revisado, NO sobrescribimos su decisión.
      // Sólo si seguía como candidate, actualizamos status (no-op real).
      await intrusionRepo().save(existing);
      result.updated++;
    } else {
      await intrusionRepo().save(
        intrusionRepo().create({ ...payload, status: 'candidate' }),
      );
      result.inserted++;
    }
  }

  return result;
};

export class CoastalIntrusionService {
  // Lista con filtros opcionales. Orden por área descendente (las
  // construcciones más grandes se revisan primero) + ordenamiento secundario
  // por status en memoria (candidate < verified < escalated < dismissed)
  // para que la cola pendiente flote arriba sin meter un CASE en SQL —
  // TypeORM no parsea bien CASE en orderBy cuando hay paginación.
  //
  // El nombre del arrecife se resuelve en el frontend desde el `reefsStore`
  // local, así que NO hacemos leftJoinAndMap aquí (innecesario y antes
  // colisionaba con el alias parser).
  async list(filters: {
    reefId?: number;
    status?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { page = 1, limit = 100 } = filters;
    const qb = intrusionRepo()
      .createQueryBuilder('i')
      .orderBy('i.areaM2', 'DESC');
    if (filters.reefId) qb.andWhere('i.reefId = :reefId', { reefId: filters.reefId });
    if (filters.status) qb.andWhere('i.status = :status', { status: filters.status });
    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();

    // Re-orden secundario en memoria por prioridad de status. Sólo afecta
    // a los `limit` items de la página actual — costo despreciable.
    const statusPriority: Record<string, number> = {
      candidate: 0, verified: 1, escalated: 2, dismissed: 3,
    };
    items.sort((a, b) => {
      const pa = statusPriority[a.status] ?? 99;
      const pb = statusPriority[b.status] ?? 99;
      if (pa !== pb) return pa - pb;
      return Number(b.areaM2 ?? 0) - Number(a.areaM2 ?? 0);
    });

    return { items, pagination: { page, limit, total } };
  }

  async get(id: number) {
    const r = await intrusionRepo().findOne({ where: { id } });
    if (!r) throw new AppError('Detección no encontrada', 404);
    return r;
  }

  // Corre el detector para un reef específico, o todos si no se pasa id.
  // Secuencial con delay para no saturar Overpass (rate-limit blando).
  async runDetection(reefId?: number) {
    const reefs = reefId
      ? [await reefRepo().findOne({ where: { id: reefId } })].filter(Boolean) as ObsReef[]
      : await reefRepo().find();
    if (reefs.length === 0) throw new AppError('No hay arrecifes para procesar', 404);

    const startedAt = new Date();
    const results: DetectionResult[] = [];
    for (const reef of reefs) {
      try {
        results.push(await detectIntrusionsForReef(reef));
      } catch (e: any) {
        results.push({
          reefId: reef.id,
          reefName: reef.name,
          buildingsScanned: 0,
          candidates: 0,
          inserted: 0,
          updated: 0,
          skipped: 0,
          reason: `error: ${e?.message || 'unknown'}`,
        });
      }
      // Throttle suave: Overpass agradece <0.5 req/s sostenido
      await new Promise((res) => setTimeout(res, 1500));
    }

    const totals = results.reduce(
      (a, r) => ({
        buildingsScanned: a.buildingsScanned + r.buildingsScanned,
        candidates: a.candidates + r.candidates,
        inserted: a.inserted + r.inserted,
        updated: a.updated + r.updated,
        skipped: a.skipped + r.skipped,
      }),
      { buildingsScanned: 0, candidates: 0, inserted: 0, updated: 0, skipped: 0 },
    );

    return {
      startedAt,
      finishedAt: new Date(),
      reefsProcessed: results.length,
      ...totals,
      perReef: results,
    };
  }

  async verify(id: number, adminId: string, notes?: string) {
    const r = await this.get(id);
    if (r.status !== 'candidate') {
      throw new AppError('Sólo se pueden verificar detecciones en estado candidate', 400);
    }
    r.status = 'verified';
    r.reviewedBy = adminId;
    r.reviewedAt = new Date();
    r.reviewerNotes = notes ?? null;
    return intrusionRepo().save(r);
  }

  async dismiss(id: number, adminId: string, notes: string) {
    const r = await this.get(id);
    if (r.status === 'escalated') {
      throw new AppError('No se puede descartar una detección ya escalada a conflicto', 400);
    }
    r.status = 'dismissed';
    r.reviewedBy = adminId;
    r.reviewedAt = new Date();
    r.reviewerNotes = notes || 'sin notas';
    return intrusionRepo().save(r);
  }

  // Promueve la detección a `ObsConflict`. La detección queda en estado
  // 'escalated' apuntando al id del conflicto creado para trazabilidad.
  async escalate(
    id: number,
    adminId: string,
    payload: {
      title: string;
      summary: string;
      fullStory?: string;
      intensity?: string;
      affectedCommunities?: string[];
    },
  ) {
    const r = await this.get(id);
    if (r.status === 'escalated' && r.escalatedConflictId) {
      throw new AppError('Esta detección ya fue escalada', 400);
    }

    const conflict = conflictRepo().create({
      title: payload.title,
      summary: payload.summary,
      fullStory: payload.fullStory || payload.summary,
      reefIds: r.reefId ? [r.reefId] : [],
      state: '',
      threats: ['coastal_development'],
      intensity: (payload.intensity as any) || 'medium',
      status: 'emerging',
      affectedCommunities: payload.affectedCommunities || [],
      drivers: [],
      resistance: [],
      mediaUrls: [],
      startedAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
      geometry: r.geometry,
      visible: false, // los conflictos creados desde el detector entran ocultos
                     // hasta que el admin complete la narrativa
      archived: false,
    });
    const savedConflict = await conflictRepo().save(conflict);

    r.status = 'escalated';
    r.reviewedBy = adminId;
    r.reviewedAt = new Date();
    r.escalatedConflictId = savedConflict.id;
    await intrusionRepo().save(r);

    return { intrusion: r, conflict: savedConflict };
  }

  // ════════════════════════════════════════════════════════════════
  //  Fase 2 — Detección de cambio temporal vía NDBI Sentinel-2
  // ════════════════════════════════════════════════════════════════
  // NDBI = (SWIR1 - NIR) / (SWIR1 + NIR) = (B11 - B8) / (B11 + B8)
  //   > 0.0 → superficie construida
  //   < 0.0 → vegetación / agua / suelo desnudo no construido
  //
  // Comparamos dos ventanas temporales sobre el centroide del footprint:
  //   - baseline: 7 años atrás ± 6 meses
  //   - current : últimos 6 meses
  // Si NDBI sube significativamente entre epochs → construcción "nueva".
  // Si baseline ya era alto → estructura legacy (probablemente con permiso
  // o predio anterior a la regulación).

  // Fase 3: muestreo sobre el polígono completo del footprint y devuelve
  // NDBI + NDVI en una sola llamada GEE. Reemplaza al muestreo por punto.
  // Devuelve null en cualquiera de los componentes si GEE no responde con
  // imagery suficiente (ej. cobertura nube alta).
  private async samplePolygonBands(
    polygon: GeoJSON.Polygon,
    fromDate: string,
    toDate: string,
  ): Promise<{ ndbi: number | null; ndvi: number | null }> {
    const empty = { ndbi: null, ndvi: null };
    if (!config.gee.serviceAccountKey || !config.gee.projectId) return empty;
    const token = await getGEEToken();
    if (!token) return empty;

    // GEE Geometry.Polygon espera coordinates como List<List<List<Number>>>.
    // El polygon GeoJSON ya tiene esa forma (`[[[lng,lat],...]]`).
    const polyCoords = polygon.coordinates;

    try {
      const res = await fetch(
        `https://earthengine.googleapis.com/v1/projects/${config.gee.projectId}/value:compute`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(60000),
          body: JSON.stringify({
            expression: {
              functionInvocationValue: {
                functionName: 'Image.reduceRegion',
                arguments: {
                  image: {
                    functionInvocationValue: {
                      functionName: 'Image.select',
                      arguments: {
                        input: {
                          functionInvocationValue: {
                            functionName: 'ImageCollection.median',
                            arguments: {
                              collection: {
                                functionInvocationValue: {
                                  functionName: 'ImageCollection.filterDate',
                                  arguments: {
                                    collection: {
                                      functionInvocationValue: {
                                        functionName: 'ImageCollection.filterBounds',
                                        arguments: {
                                          collection: { constantValue: 'COPERNICUS/S2_SR_HARMONIZED' },
                                          geometry: {
                                            functionInvocationValue: {
                                              functionName: 'Geometry.Polygon',
                                              arguments: { coordinates: { constantValue: polyCoords } },
                                            },
                                          },
                                        },
                                      },
                                    },
                                    start: { constantValue: fromDate },
                                    end: { constantValue: toDate },
                                  },
                                },
                              },
                            },
                          },
                        },
                        bandSelectors: { constantValue: ['B4', 'B8', 'B11'] },
                      },
                    },
                  },
                  reducer: { constantValue: 'mean' },
                  geometry: {
                    functionInvocationValue: {
                      functionName: 'Geometry.Polygon',
                      arguments: { coordinates: { constantValue: polyCoords } },
                    },
                  },
                  scale: { constantValue: 10 },
                  // Para footprints muy pequeños GEE puede rechazar por
                  // resolución; bestEffort cae a una escala mayor automática.
                  bestEffort: { constantValue: true },
                },
              },
            },
          }),
        },
      );

      const data = (await res.json()) as any;
      const r = data?.result;
      if (!r) return empty;
      const red = Number(r.B4) / 10000;
      const nir = Number(r.B8) / 10000;
      const swir = Number(r.B11) / 10000;
      const ndbi =
        Number.isFinite(nir) && Number.isFinite(swir) && swir + nir !== 0
          ? (swir - nir) / (swir + nir)
          : null;
      const ndvi =
        Number.isFinite(red) && Number.isFinite(nir) && red + nir !== 0
          ? (nir - red) / (nir + red)
          : null;
      return { ndbi, ndvi };
    } catch (e) {
      console.warn('[Sentinel2 polygon] sample error:', (e as Error).message);
      return empty;
    }
  }

  // Pulla la mediana de bandas B8 + B11 sobre un punto en una ventana de
  // tiempo. Devuelve null si GEE no está configurado o no hay imagery
  // en el rango (cobertura nube > umbral, sitio offshore, etc.).
  private async sampleSentinel2NDBI(
    lng: number,
    lat: number,
    fromDate: string,
    toDate: string,
  ): Promise<number | null> {
    if (!config.gee.serviceAccountKey || !config.gee.projectId) return null;
    const token = await getGEEToken();
    if (!token) return null;

    try {
      const res = await fetch(
        `https://earthengine.googleapis.com/v1/projects/${config.gee.projectId}/value:compute`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(45000),
          body: JSON.stringify({
            expression: {
              functionInvocationValue: {
                functionName: 'Image.reduceRegion',
                arguments: {
                  image: {
                    functionInvocationValue: {
                      functionName: 'Image.select',
                      arguments: {
                        input: {
                          functionInvocationValue: {
                            functionName: 'ImageCollection.median',
                            arguments: {
                              collection: {
                                functionInvocationValue: {
                                  functionName: 'ImageCollection.filterDate',
                                  arguments: {
                                    collection: {
                                      functionInvocationValue: {
                                        functionName: 'ImageCollection.filterBounds',
                                        arguments: {
                                          collection: { constantValue: 'COPERNICUS/S2_SR_HARMONIZED' },
                                          geometry: {
                                            functionInvocationValue: {
                                              functionName: 'Geometry.Point',
                                              arguments: { coordinates: { constantValue: [lng, lat] } },
                                            },
                                          },
                                        },
                                      },
                                    },
                                    start: { constantValue: fromDate },
                                    end: { constantValue: toDate },
                                  },
                                },
                              },
                            },
                          },
                        },
                        bandSelectors: { constantValue: ['B8', 'B11'] },
                      },
                    },
                  },
                  reducer: { constantValue: 'mean' },
                  geometry: {
                    functionInvocationValue: {
                      functionName: 'Geometry.Point',
                      arguments: { coordinates: { constantValue: [lng, lat] } },
                    },
                  },
                  // Buffer pequeño para promediar varios píxeles 10 m
                  scale: { constantValue: 20 },
                },
              },
            },
          }),
        },
      );

      const data = (await res.json()) as any;
      const r = data?.result;
      if (!r) return null;
      const nir = Number(r.B8) / 10000;
      const swir = Number(r.B11) / 10000;
      if (!Number.isFinite(nir) || !Number.isFinite(swir)) return null;
      const denom = swir + nir;
      if (denom === 0) return null;
      return (swir - nir) / denom;
    } catch (e) {
      console.warn('[NDBI] sample error:', (e as Error).message);
      return null;
    }
  }

  // Score 0-100 derivado de NDBI + corroboración NDVI (Fase 3).
  //   Lógica de NDBI (Fase 2 base):
  //     - baselineWeight: 1.0 si NDBI baseline ≤ 0 (no construido), 0.0 si ≥ 0.1.
  //     - deltaWeight: 0 si NDBI delta ≤ 0, 1.0 si delta ≥ 0.4.
  //   Corroboración NDVI (Fase 3, opcional):
  //     - Si NDVI bajó (delta < 0): construcción genuina removió vegetación → boost ×1.0
  //     - Si NDVI subió o no cambió: sospechoso (artefacto imagery o cambio menor) → penalización ×0.6
  //   Score final = baselineWeight × deltaWeight × ndviMultiplier × 100
  private computeNoveltyScore(
    ndbiBaseline: number,
    ndbiCurrent: number,
    ndviBaseline: number | null,
    ndviCurrent: number | null,
  ): number {
    const ndbiDelta = ndbiCurrent - ndbiBaseline;
    const baselineWeight = Math.max(0, Math.min(1, (0.1 - ndbiBaseline) / 0.2));
    const deltaWeight = Math.max(0, Math.min(1, ndbiDelta / 0.4));

    let ndviMultiplier = 1.0;
    if (ndviBaseline !== null && ndviCurrent !== null) {
      const ndviDelta = ndviCurrent - ndviBaseline;
      // Caída de NDVI ≥ 0.15 → corrobora (×1.0). Sin caída → penalización
      // gradual hasta 0.6.
      ndviMultiplier = ndviDelta <= -0.15 ? 1.0 : Math.max(0.6, 1 - (ndviDelta + 0.15) * 1.5);
      ndviMultiplier = Math.min(1.0, Math.max(0.6, ndviMultiplier));
    }

    return Math.round(baselineWeight * deltaWeight * ndviMultiplier * 100 * 100) / 100;
  }

  async analyzeNovelty(id: number, opts?: { baselineYearsBack?: number }): Promise<ObsCoastalIntrusion> {
    const intrusion = await this.get(id);
    if (!config.gee.serviceAccountKey || !config.gee.projectId) {
      throw new AppError(
        'Análisis de novedad requiere GEE_SERVICE_ACCOUNT_KEY + GEE_PROJECT_ID en .env',
        503,
      );
    }

    const yearsBack = opts?.baselineYearsBack ?? 7;

    // Ventanas con margen amplio para encontrar imagery con bajas nubes.
    const today = new Date();
    const currentTo = today.toISOString().slice(0, 10);
    const currentFromD = new Date(today);
    currentFromD.setMonth(currentFromD.getMonth() - 6);
    const currentFrom = currentFromD.toISOString().slice(0, 10);

    const baselineToD = new Date(today);
    baselineToD.setFullYear(baselineToD.getFullYear() - yearsBack);
    baselineToD.setMonth(baselineToD.getMonth() + 6);
    const baselineTo = baselineToD.toISOString().slice(0, 10);
    const baselineFromD = new Date(today);
    baselineFromD.setFullYear(baselineFromD.getFullYear() - yearsBack);
    baselineFromD.setMonth(baselineFromD.getMonth() - 6);
    const baselineFrom = baselineFromD.toISOString().slice(0, 10);

    // Fase 3: muestreamos sobre el polígono completo y obtenemos NDBI + NDVI.
    // Si la geometry es MultiPolygon o algo raro, caemos al primer polígono
    // (los detectores OSM normalmente devuelven Polygon simple).
    const poly =
      intrusion.geometry?.type === 'Polygon'
        ? (intrusion.geometry as unknown as GeoJSON.Polygon)
        : null;

    if (!poly) {
      throw new AppError('La geometría no es Polygon — no se puede analizar', 400);
    }

    const [baseline, current] = await Promise.all([
      this.samplePolygonBands(poly, baselineFrom, baselineTo),
      this.samplePolygonBands(poly, currentFrom, currentTo),
    ]);

    if (baseline.ndbi === null || current.ndbi === null) {
      throw new AppError(
        'GEE no devolvió datos NDBI suficientes para alguna ventana (cobertura nube alta o sitio offshore).',
        502,
      );
    }

    const ndbiDelta = current.ndbi - baseline.ndbi;
    const ndviDelta =
      baseline.ndvi !== null && current.ndvi !== null ? current.ndvi - baseline.ndvi : null;

    const score = this.computeNoveltyScore(
      baseline.ndbi,
      current.ndbi,
      baseline.ndvi,
      current.ndvi,
    );

    intrusion.ndbiBaseline = Math.round(baseline.ndbi * 10000) / 10000;
    intrusion.ndbiCurrent = Math.round(current.ndbi * 10000) / 10000;
    intrusion.ndbiDelta = Math.round(ndbiDelta * 10000) / 10000;
    intrusion.ndviBaseline = baseline.ndvi !== null ? Math.round(baseline.ndvi * 10000) / 10000 : null;
    intrusion.ndviCurrent = current.ndvi !== null ? Math.round(current.ndvi * 10000) / 10000 : null;
    intrusion.ndviDelta = ndviDelta !== null ? Math.round(ndviDelta * 10000) / 10000 : null;
    intrusion.samplingMethod = 'polygon';
    intrusion.noveltyScore = score;
    intrusion.noveltyAnalyzedAt = new Date();
    intrusion.noveltyEpochs = {
      baseline: `${baselineFrom} a ${baselineTo}`,
      current: `${currentFrom} a ${currentTo}`,
    };

    return intrusionRepo().save(intrusion);
  }

  // Serie temporal anual sobre el polígono. Pulla la mediana imagery por año
  // entre `fromYear` y el año actual (típicamente 8-10 años). Útil para ver
  // CUÁNDO empezó la construcción, no sólo si es nueva. Más caro que el
  // análisis estándar (10 llamadas GEE secuenciales con throttle 1s).
  async generateNoveltyTimeSeries(
    id: number,
    opts: { fromYear?: number } = {},
  ): Promise<ObsCoastalIntrusion> {
    const intrusion = await this.get(id);
    if (!config.gee.serviceAccountKey || !config.gee.projectId) {
      throw new AppError(
        'Time-series requiere GEE_SERVICE_ACCOUNT_KEY + GEE_PROJECT_ID en .env',
        503,
      );
    }
    if (intrusion.geometry?.type !== 'Polygon') {
      throw new AppError('La geometría no es Polygon — no se puede serializar', 400);
    }
    const poly = intrusion.geometry as unknown as GeoJSON.Polygon;

    const currentYear = new Date().getFullYear();
    // Sentinel-2 SR Harmonized empieza ~2017 (cobertura global previa es parcial).
    const fromYear = Math.max(opts.fromYear ?? currentYear - 8, 2017);

    const series: Array<{ year: number; ndbi: number | null; ndvi: number | null }> = [];
    for (let y = fromYear; y <= currentYear; y++) {
      const from = `${y}-01-01`;
      const to = `${y}-12-31`;
      const sample = await this.samplePolygonBands(poly, from, to);
      series.push({ year: y, ndbi: sample.ndbi, ndvi: sample.ndvi });
      // Throttle generoso — esto NO es batch crítico, vale la pena no
      // estresar GEE.
      await new Promise((res) => setTimeout(res, 1000));
    }

    intrusion.noveltyTimeSeries = series;
    return intrusionRepo().save(intrusion);
  }

  // Batch: analiza todos los candidatos sin novelty score, o los que cumplan
  // un filtro. Throttle de 600 ms entre llamadas — GEE acepta sostenido bajo.
  async analyzeNoveltyBatch(filter: { reefId?: number; status?: string; limit?: number } = {}) {
    if (!config.gee.serviceAccountKey || !config.gee.projectId) {
      throw new AppError(
        'Análisis de novedad requiere GEE_SERVICE_ACCOUNT_KEY + GEE_PROJECT_ID en .env',
        503,
      );
    }

    const qb = intrusionRepo()
      .createQueryBuilder('i')
      .where('i.noveltyAnalyzedAt IS NULL');
    if (filter.reefId) qb.andWhere('i.reefId = :reefId', { reefId: filter.reefId });
    if (filter.status) qb.andWhere('i.status = :status', { status: filter.status });
    qb.orderBy('i.areaM2', 'DESC').take(filter.limit ?? 50);
    const targets = await qb.getMany();

    const results: { id: number; ok: boolean; score?: number; error?: string }[] = [];
    for (const t of targets) {
      try {
        const updated = await this.analyzeNovelty(t.id);
        results.push({ id: t.id, ok: true, score: Number(updated.noveltyScore) });
      } catch (e: any) {
        results.push({ id: t.id, ok: false, error: e?.message || 'unknown' });
      }
      await new Promise((res) => setTimeout(res, 600));
    }

    return {
      processed: targets.length,
      ok: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    };
  }
}
