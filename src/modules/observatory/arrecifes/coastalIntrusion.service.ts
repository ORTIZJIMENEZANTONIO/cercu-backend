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
  // convertimos a LineString y aplicamos buffer. Cedemos el event loop cada
  // 10 buffers para no bloquear el HTTP server (turf.buffer es síncrono).
  const yieldEventLoop = () => new Promise<void>((res) => setImmediate(res));
  const buffered: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>[] = [];
  for (let i = 0; i < elements.length; i++) {
    if (i > 0 && i % 10 === 0) await yieldEventLoop();
    const el = elements[i];
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

  // Unión progresiva de los buffers — Turf union acepta de a 2. Igual cedemos
  // el event loop cada 5 uniones (turf.union es la op más cara con polígonos
  // multi-segmento como costas largas).
  let merged = buffered[0];
  for (let i = 1; i < buffered.length; i++) {
    if (i > 1 && i % 5 === 0) await yieldEventLoop();
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

interface DetectionRunSummary {
  startedAt: Date;
  finishedAt: Date;
  reefsProcessed: number;
  buildingsScanned: number;
  candidates: number;
  inserted: number;
  updated: number;
  skipped: number;
  perReef: DetectionResult[];
}

interface DetectorJob {
  id: string;
  status: 'running' | 'done' | 'error';
  reefId: number | null;
  startedAt: Date;
  lastUpdatedAt: number;
  progress: { current: number; total: number; currentReefName?: string | null };
  perReef: DetectionResult[];
  result: DetectionRunSummary | null;
  error: string | null;
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

  // Helper: cede el event loop. Sin esto, el bucle de turf.intersect/area
  // sobre miles de polígonos es 100% síncrono y bloquea Node por minutos —
  // ninguna otra HTTP request puede responder mientras corre. Nginx mata
  // entonces los GET /jobs/:jobId con 502 Bad Gateway.
  //
  // setImmediate libera el event loop después de cada lote para que el HTTP
  // server pueda atender requests entrantes. Costo: ~0 si nada espera; si hay
  // pending IO/timers, se procesan antes de la siguiente iteración.
  const yieldEventLoop = () => new Promise<void>((res) => setImmediate(res));
  const YIELD_EVERY = 25; // cede cada 25 edificios procesados

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (i > 0 && i % YIELD_EVERY === 0) await yieldEventLoop();

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

  // Corre el detector síncronamente (un reef o todos). Sigue disponible para
  // CLI / cron, pero el endpoint HTTP usa `runDetectionAsync` para evitar
  // timeouts del proxy nginx. Secuencial con delay para no saturar Overpass.
  //
  // Callbacks:
  //   - `onReefStart(reef, idx, total)` se invoca ANTES de empezar cada reef.
  //     Útil para mostrar "procesando X" en la UI mientras tarda Overpass.
  //   - `onReefDone(result, idx, total)` se invoca DESPUÉS con el resultado.
  async runDetection(
    reefId?: number,
    onReefDone?: (result: DetectionResult, idx: number, total: number) => void,
    onReefStart?: (reef: ObsReef, idx: number, total: number) => void,
  ) {
    const reefs = reefId
      ? [await reefRepo().findOne({ where: { id: reefId } })].filter(Boolean) as ObsReef[]
      : await reefRepo().find();
    if (reefs.length === 0) throw new AppError('No hay arrecifes para procesar', 404);

    const startedAt = new Date();
    const results: DetectionResult[] = [];
    for (let i = 0; i < reefs.length; i++) {
      const reef = reefs[i];
      onReefStart?.(reef, i, reefs.length);
      let result: DetectionResult;
      try {
        result = await detectIntrusionsForReef(reef);
      } catch (e: any) {
        result = {
          reefId: reef.id,
          reefName: reef.name,
          buildingsScanned: 0,
          candidates: 0,
          inserted: 0,
          updated: 0,
          skipped: 0,
          reason: `error: ${e?.message || 'unknown'}`,
        };
      }
      results.push(result);
      onReefDone?.(result, i + 1, reefs.length);

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

  // ───────────────────────── Job manager (in-memory) ─────────────────────────
  //
  // El detector corre 12 reefs × 2 queries Overpass (timeout 30s c/u) + 1.5s
  // de throttle entre reefs → hasta 7 minutos en peor caso. Nginx mata las
  // conexiones HTTP a los 60s, así que el endpoint POST /run lanza un job
  // background y devuelve un `jobId`. El cliente hace polling al `GET
  // /run/:jobId` para ver progreso y resultado final.
  //
  // Estado en memoria (Map). Se pierde al reiniciar el proceso PM2 — eso es
  // aceptable porque el detector es idempotente: re-correrlo no duplica.
  // Cleanup automático: jobs completados o erróreos viven 30 minutos para
  // permitir revisión post-mortem; despues se purgan.

  // Métodos estáticos en `globalThis` para sobrevivir al hot-reload de
  // ts-node-dev en desarrollo.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static readonly _jobs: Map<string, DetectorJob> = (globalThis as any).__coastalDetectorJobs__ ?? new Map();
  static {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__coastalDetectorJobs__ = CoastalIntrusionService._jobs;
  }

  private static newJobId() {
    return `job_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }

  private static cleanupOldJobs() {
    const now = Date.now();
    for (const [id, job] of CoastalIntrusionService._jobs) {
      if (job.status !== 'running' && now - job.lastUpdatedAt > 30 * 60 * 1000) {
        CoastalIntrusionService._jobs.delete(id);
      }
    }
  }

  // Lanza el job en background y devuelve inmediatamente el jobId. El
  // procesamiento corre fuera del request HTTP (no bloquea ni el response ni
  // el event loop más allá del trabajo async).
  runDetectionAsync(reefId?: number): { jobId: string } {
    CoastalIntrusionService.cleanupOldJobs();

    const jobId = CoastalIntrusionService.newJobId();
    const job: DetectorJob = {
      id: jobId,
      status: 'running',
      reefId: reefId ?? null,
      startedAt: new Date(),
      lastUpdatedAt: Date.now(),
      progress: { current: 0, total: 0 },
      perReef: [],
      result: null,
      error: null,
    };
    CoastalIntrusionService._jobs.set(jobId, job);

    // Fire-and-forget. Los errores se capturan en el catch del .then; el job
    // queda con status='error' para que el cliente pueda verlo via polling.
    (async () => {
      try {
        const result = await this.runDetection(
          reefId,
          (r, current, total) => {
            job.progress = { current, total, currentReefName: null };
            job.perReef.push(r);
            job.lastUpdatedAt = Date.now();
          },
          (reef, idx, total) => {
            // Empezamos a procesar `reef` — notifica al cliente para que el
            // progress bar muestre el nombre actual y no quede mudo durante
            // los 30s de Overpass + buffer.
            job.progress = { current: idx, total, currentReefName: reef.name };
            job.lastUpdatedAt = Date.now();
          },
        );
        job.status = 'done';
        job.result = result;
        job.progress = { current: result.reefsProcessed, total: result.reefsProcessed, currentReefName: null };
        job.lastUpdatedAt = Date.now();
      } catch (e: any) {
        job.status = 'error';
        job.error = e?.message || 'error desconocido';
        job.lastUpdatedAt = Date.now();
      }
    })();

    return { jobId };
  }

  getDetectionJob(jobId: string) {
    const job = CoastalIntrusionService._jobs.get(jobId);
    if (!job) throw new AppError('Job no encontrado o expirado', 404);
    return {
      id: job.id,
      status: job.status,
      reefId: job.reefId,
      startedAt: job.startedAt.toISOString(),
      progress: job.progress,
      perReef: job.perReef,
      result: job.result,
      error: job.error,
    };
  }

  listDetectionJobs() {
    CoastalIntrusionService.cleanupOldJobs();
    const jobs = Array.from(CoastalIntrusionService._jobs.values())
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .map((j) => ({
        id: j.id,
        status: j.status,
        reefId: j.reefId,
        startedAt: j.startedAt.toISOString(),
        progress: j.progress,
        finished: j.status !== 'running',
      }));
    return { jobs };
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

  // ──────────────────────────── Manual entry ────────────────────────────
  // El detector OSM no captura todo (especialmente edificios sin mapear). Este
  // endpoint permite al revisor crear un caso manualmente a partir de un
  // polígono GeoJSON dibujado o pegado, atribuyendo a un arrecife concreto.
  //
  // Defaults:
  //   - status = 'verified' (asume que el revisor ya confirmó visualmente)
  //   - source = 'manual'
  //   - centroid: si el geometry es Point se usa tal cual; si es Polygon se
  //     calcula con turf.centroid; si es MultiPolygon se usa el centroide del
  //     primer polígono.
  //   - areaM2: si es Polygon/MultiPolygon, turf.area; si es Point, null.
  async createManual(
    payload: {
      reefId: number | null;
      geometry: any;
      status?: string;
      reviewerNotes?: string;
      osmId?: string;
      osmTags?: Record<string, string>;
    },
    adminId: string,
  ) {
    if (!payload.geometry || typeof payload.geometry !== 'object') {
      throw new AppError('Falta `geometry` GeoJSON', 400);
    }
    const geomType = payload.geometry.type;
    if (!['Point', 'Polygon', 'MultiPolygon'].includes(geomType)) {
      throw new AppError(
        `geometry.type debe ser Point | Polygon | MultiPolygon (recibido ${geomType})`,
        400,
      );
    }

    let centroidLat: number;
    let centroidLng: number;
    let areaM2: number | null = null;
    let polygonGeom: any = payload.geometry;

    if (geomType === 'Point') {
      const [lng, lat] = payload.geometry.coordinates as [number, number];
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        throw new AppError('Point.coordinates debe ser [lng, lat] numérico', 400);
      }
      centroidLat = lat;
      centroidLng = lng;
      // Convertimos un Point a un buffer pequeño para almacenar como polígono y
      // que la UI lo trate igual que las detecciones automáticas.
      const buffered = turf.buffer(turf.point([lng, lat]), 25, { units: 'meters' });
      polygonGeom = buffered?.geometry ?? payload.geometry;
      try {
        areaM2 = buffered ? turf.area(buffered) : null;
      } catch {
        areaM2 = null;
      }
    } else {
      try {
        const c = turf.centroid(payload.geometry as any);
        const [lng, lat] = c.geometry.coordinates;
        centroidLat = lat;
        centroidLng = lng;
      } catch {
        throw new AppError('No se pudo calcular el centroide del geometry', 400);
      }
      try {
        areaM2 = turf.area(payload.geometry as any);
      } catch {
        areaM2 = null;
      }
    }

    const status = payload.status ?? 'verified';
    if (!['candidate', 'verified', 'dismissed'].includes(status)) {
      throw new AppError(`status inválido: ${status}`, 400);
    }

    const row = intrusionRepo().create({
      reefId: payload.reefId ?? null,
      osmId: payload.osmId ?? null,
      osmTags: payload.osmTags ?? null,
      geometry: polygonGeom,
      centroidLat: Number(centroidLat.toFixed(7)),
      centroidLng: Number(centroidLng.toFixed(7)),
      areaM2: areaM2 !== null ? Number(areaM2.toFixed(2)) : null,
      zofematOverlapPct: null,
      status,
      source: 'manual',
      detectedAt: new Date(),
      reviewedBy: status === 'candidate' ? null : adminId,
      reviewedAt: status === 'candidate' ? null : new Date(),
      reviewerNotes: payload.reviewerNotes ?? null,
      escalatedConflictId: null,
      ndbiBaseline: null,
      ndbiCurrent: null,
      ndbiDelta: null,
      noveltyScore: null,
      noveltyAnalyzedAt: null,
      noveltyEpochs: null,
      ndviBaseline: null,
      ndviCurrent: null,
      ndviDelta: null,
      samplingMethod: null,
      noveltyTimeSeries: null,
    });
    return intrusionRepo().save(row);
  }

  // Borra una detección (sólo manuales o casos descartados deberían llegar
  // aquí — un caso ya escalado a `ObsConflict` se debería limpiar primero el
  // conflicto). Sin restricción dura: dejamos juicio al admin.
  async deleteManual(id: number) {
    const r = await this.get(id);
    await intrusionRepo().remove(r);
    return { deleted: true };
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
