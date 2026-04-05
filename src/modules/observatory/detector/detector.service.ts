import * as turf from '@turf/turf';
import { AppDataSource } from '../../../ormconfig';
import {
  ProspectSubmission,
  ProspectStatus,
  ProspectSource,
} from '../../../entities/observatory/ProspectSubmission';

// ══════════════════════════════════════
//  Types
// ══════════════════════════════════════

interface BBox { south: number; west: number; north: number; east: number }

interface DetectionParams {
  bbox: BBox;
  minAreaM2?: number;
  maxAreaM2?: number;
  minScore?: number;
}

// Techos Verdes indices
interface GreenRoofIndices {
  refId: string;                // OSM reference ID
  ndviPotencial: number;        // 0-1: estimated green-roof NDVI potential based on roof type/area
  rectangularidad: number;      // 0-1: rectangularity index
  compacidad: number;           // 0-1: Polsby-Popper compactness
  orientacion: number;          // 0-360: main axis azimuth (degrees)
  perimetroM: number;           // perimeter in meters
  niveles: number;              // building levels (0 if unknown)
  cargaEstimada: string;        // 'apta' | 'requiere_evaluacion' | 'no_recomendado' | 'sin_datos'
  islaTerApprox: number;        // 0-1: urban heat island mitigation potential (based on area)
  captacionPluvial: number;     // L/year estimated rainwater capture (area * 800mm avg CDMX)
  reduccionCO2: number;         // kg/year estimated CO2 capture (area * 0.968 from Cervantes Najera)
  materialTecho: string;        // from OSM or 'desconocido'
  zonaSismica: string;          // estimated from lat/lng CDMX zones
}

// Humedales indices
interface HumedalIndices {
  refId: string;
  ndwiPotencial: number;        // 0-1: water index potential
  capacidadRetencion: number;   // m3 estimated retention capacity
  conectividadHidrica: number;  // 0-1: proximity to water network
  serviciosEcosistemicos: number; // 0-5 count of estimated ecosystem services
  biodiversidadPotencial: number; // 0-1: Shannon diversity potential estimate
  perimetroM: number;
  compacidad: number;
  captacionPluvial: number;     // L/year
  reduccionTemperatura: number; // °C estimated local cooling
  tipoSuelo: string;           // estimated from area type
}

interface DetectedCandidate {
  nombre: string;
  lat: number;
  lng: number;
  areaM2: number;
  score: number;
  tipo: string;
  tags: Record<string, string>;
  geometry: any;
  reasons: string[];
  indices: GreenRoofIndices | HumedalIndices;
}

// ══════════════════════════════════════
//  Overpass API Helper
// ══════════════════════════════════════

async function queryOverpass(query: string): Promise<any> {
  const urls = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ];
  let lastError: Error | null = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(120_000),
      });
      if (res.ok) return res.json();
      lastError = new Error(`Overpass ${res.status} from ${url}`);
    } catch (e: any) { lastError = e; }
  }
  throw lastError || new Error('Overpass API unavailable');
}

function bboxString(b: BBox) { return `${b.south},${b.west},${b.north},${b.east}`; }

function clampBBox(b: BBox): BBox {
  const MAX_DEG = 0.045;
  const cLat = (b.south + b.north) / 2, cLng = (b.west + b.east) / 2;
  return {
    south: (b.north - b.south) > MAX_DEG ? cLat - MAX_DEG / 2 : b.south,
    north: (b.north - b.south) > MAX_DEG ? cLat + MAX_DEG / 2 : b.north,
    west: (b.east - b.west) > MAX_DEG ? cLng - MAX_DEG / 2 : b.west,
    east: (b.east - b.west) > MAX_DEG ? cLng + MAX_DEG / 2 : b.east,
  };
}

function osmWayToPolygon(way: any, nodes: Map<number, [number, number]>): number[][] | null {
  const coords: number[][] = [];
  for (const nodeId of way.nodes) {
    const n = nodes.get(nodeId);
    if (!n) return null;
    coords.push([n[1], n[0]]);
  }
  if (coords.length < 4) return null;
  const f = coords[0], l = coords[coords.length - 1];
  if (f[0] !== l[0] || f[1] !== l[1]) coords.push([...f]);
  return coords;
}

// ══════════════════════════════════════
//  Spatial Index Functions
// ══════════════════════════════════════

function rectangularity(poly: any): number {
  const a = turf.area(poly);
  const bb = turf.bboxPolygon(turf.bbox(poly));
  const bbA = turf.area(bb);
  return bbA > 0 ? Math.min(a / bbA, 1) : 0;
}

// Polsby-Popper compactness: 4π * area / perimeter²  (1 = circle, 0 = elongated)
function compactness(poly: any): number {
  const a = turf.area(poly);
  const p = turf.length(turf.polygonToLine(poly), { units: 'meters' });
  return p > 0 ? Math.min((4 * Math.PI * a) / (p * p), 1) : 0;
}

// Approximate main axis orientation via bbox
function orientation(poly: any): number {
  const bb = turf.bbox(poly);
  const dx = bb[2] - bb[0]; // lng span
  const dy = bb[3] - bb[1]; // lat span
  const rad = Math.atan2(dx * 85000, dy * 111000); // approximate meters
  return ((rad * 180 / Math.PI) + 360) % 360;
}

// Estimate CDMX seismic zone from latitude (simplified)
function estimateZonaSismica(lat: number): string {
  if (lat >= 19.45) return 'I';       // north (firmer ground)
  if (lat >= 19.40) return 'IIa';
  if (lat >= 19.35) return 'IIIa';    // lake zone
  if (lat >= 19.28) return 'IIIb';
  return 'IIIc';                       // south lake zone
}

// Estimate structural load aptitude from building type + levels
function estimateCargaEstructural(tipo: string, niveles: number): string {
  const strong = ['commercial', 'industrial', 'warehouse', 'office', 'public', 'civic', 'government', 'hospital', 'university'];
  if (strong.includes(tipo)) {
    return niveles <= 8 ? 'apta' : 'requiere_evaluacion';
  }
  if (tipo === 'apartments' || tipo === 'residential') {
    return niveles <= 3 ? 'apta' : niveles <= 6 ? 'requiere_evaluacion' : 'no_recomendado';
  }
  if (niveles > 0) return niveles <= 5 ? 'requiere_evaluacion' : 'no_recomendado';
  return 'sin_datos';
}

// ══════════════════════════════════════
//  TECHOS VERDES Detection
// ══════════════════════════════════════

async function detectGreenRoofCandidates(params: DetectionParams): Promise<DetectedCandidate[]> {
  const { bbox, minAreaM2 = 200, maxAreaM2 = 50000, minScore = 30 } = params;
  const clamped = clampBBox(bbox);
  const bb = bboxString(clamped);

  const query = `
    [out:json][timeout:180][maxsize:50000000];
    (
      way["building"]["name"](${bb});
      way["building"="commercial"](${bb});
      way["building"="industrial"](${bb});
      way["building"="warehouse"](${bb});
      way["building"="office"](${bb});
      way["building"="retail"](${bb});
      way["building"="public"](${bb});
      way["building"="civic"](${bb});
      way["building"="government"](${bb});
      way["building"="hospital"](${bb});
      way["building"="school"](${bb});
      way["building"="university"](${bb});
      way["building"="apartments"]["building:levels"](${bb});
      way["building"="yes"]["building:levels"](${bb});
    );
    out body;
    >;
    out skel qt;
  `;

  const data = await queryOverpass(query);
  const nodes = new Map<number, [number, number]>();
  for (const el of data.elements) {
    if (el.type === 'node') nodes.set(el.id, [el.lat, el.lon]);
  }

  const candidates: DetectedCandidate[] = [];
  const ways = data.elements.filter((e: any) => e.type === 'way' && e.tags?.building);

  for (const way of ways) {
    const coords = osmWayToPolygon(way, nodes);
    if (!coords) continue;

    try {
      const polygon = turf.polygon([coords]);
      const areaM2 = turf.area(polygon);
      if (areaM2 < minAreaM2 || areaM2 > maxAreaM2) continue;

      const cent = turf.centroid(polygon);
      const [lng, lat] = cent.geometry.coordinates;
      const rect = rectangularity(polygon);
      const comp = compactness(polygon);
      const orient = orientation(polygon);
      const perimM = turf.length(turf.polygonToLine(polygon), { units: 'meters' });
      const tags = way.tags || {};
      const buildingType = tags.building || 'yes';
      const niveles = parseInt(tags['building:levels'] || '0');
      const materialTecho = tags['roof:material'] || tags['roof:shape'] || 'desconocido';

      // ── Scoring ──
      let score = 0;
      const reasons: string[] = [];

      if (areaM2 >= 1000) { score += 25; reasons.push('Superficie >= 1,000 m²'); }
      else if (areaM2 >= 500) { score += 20; reasons.push('Superficie >= 500 m²'); }
      else { score += 10; }

      if (rect >= 0.85) { score += 20; reasons.push(`Rectangularidad alta (${(rect * 100).toFixed(0)}%)`); }
      else if (rect >= 0.7) { score += 12; reasons.push(`Rectangularidad media (${(rect * 100).toFixed(0)}%)`); }
      else { score += 5; }

      const goodTypes = ['commercial', 'industrial', 'warehouse', 'office', 'retail', 'public', 'civic', 'government', 'hospital', 'school', 'university'];
      if (goodTypes.includes(buildingType)) { score += 15; reasons.push(`Tipo favorable: ${buildingType}`); }
      else if (buildingType === 'apartments') { score += 8; }

      if (niveles > 0 && niveles <= 5) { score += 10; reasons.push(`${niveles} niveles`); }
      else if (niveles > 5 && niveles <= 10) { score += 5; reasons.push(`${niveles} niveles`); }

      if (materialTecho === 'concrete' || materialTecho === 'flat') {
        score += 15; reasons.push(`Techo: ${materialTecho}`);
      }

      if (tags.name) { score += 5; reasons.push(`ID: ${tags.name}`); }
      if (score < minScore) continue;

      // ── Indices ──
      const zonaSismica = estimateZonaSismica(lat);
      const carga = estimateCargaEstructural(buildingType, niveles);

      // NDVI potential: estimate how suitable the roof is for vegetation
      // Based on: flat roof bonus + area + structural aptitude
      let ndviPot = 0.3; // base
      if (materialTecho === 'concrete' || materialTecho === 'flat') ndviPot += 0.3;
      if (carga === 'apta') ndviPot += 0.2;
      else if (carga === 'requiere_evaluacion') ndviPot += 0.1;
      if (areaM2 >= 500) ndviPot += 0.1;
      ndviPot = Math.min(ndviPot, 1);

      // Urban heat island mitigation: proportional to area (ref 79,584 m² → 3.5°C)
      const islaTer = Math.min(areaM2 / 79584, 1);

      const indices: GreenRoofIndices = {
        refId: `OSM-W${way.id}`,
        ndviPotencial: +ndviPot.toFixed(3),
        rectangularidad: +rect.toFixed(3),
        compacidad: +comp.toFixed(3),
        orientacion: +orient.toFixed(1),
        perimetroM: Math.round(perimM),
        niveles,
        cargaEstimada: carga,
        islaTerApprox: +islaTer.toFixed(4),
        captacionPluvial: Math.round(areaM2 * 0.8),   // 800mm/yr CDMX avg → 0.8 m3/m²
        reduccionCO2: +(areaM2 * 0.968 / 1000).toFixed(2), // ton/yr (Cervantes Najera)
        materialTecho,
        zonaSismica,
      };

      candidates.push({
        nombre: tags.name || `Edificio ${buildingType} (OSM ${way.id})`,
        lat, lng,
        areaM2: Math.round(areaM2),
        score: Math.min(score, 100),
        tipo: buildingType,
        tags,
        geometry: polygon.geometry,
        reasons,
        indices,
      });
    } catch { /* skip */ }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, 200);
}

// ══════════════════════════════════════
//  HUMEDALES Detection
// ══════════════════════════════════════

async function detectHumedalCandidates(params: DetectionParams): Promise<DetectedCandidate[]> {
  const { bbox, minAreaM2 = 100, minScore = 20 } = params;
  const clamped = clampBBox(bbox);
  const bb = bboxString(clamped);

  const query = `
    [out:json][timeout:180][maxsize:50000000];
    (
      way["natural"="water"](${bb});
      way["natural"="wetland"](${bb});
      way["waterway"](${bb});
      way["landuse"="basin"](${bb});
      way["landuse"="reservoir"](${bb});
      way["water"](${bb});
      relation["natural"="water"](${bb});
      relation["natural"="wetland"](${bb});
      way["man_made"="wastewater_plant"](${bb});
      way["amenity"="wastewater_plant"](${bb});
      way["landuse"="grass"](${bb});
      way["leisure"="park"](${bb});
    );
    out body;
    >;
    out skel qt;
  `;

  const data = await queryOverpass(query);
  const nodes = new Map<number, [number, number]>();
  for (const el of data.elements) {
    if (el.type === 'node') nodes.set(el.id, [el.lat, el.lon]);
  }

  const candidates: DetectedCandidate[] = [];
  const ways = data.elements.filter((e: any) => e.type === 'way' && e.nodes?.length >= 4);

  for (const way of ways) {
    const coords = osmWayToPolygon(way, nodes);
    if (!coords || coords.length < 4) continue;

    try {
      const polygon = turf.polygon([coords]);
      const areaM2 = turf.area(polygon);
      if (areaM2 < minAreaM2) continue;

      const cent = turf.centroid(polygon);
      const [lng, lat] = cent.geometry.coordinates;
      const tags = way.tags || {};
      const comp = compactness(polygon);
      const perimM = turf.length(turf.polygonToLine(polygon), { units: 'meters' });

      let score = 0;
      const reasons: string[] = [];
      let tipoDetectado = 'potencial';

      // Water presence → high NDWI
      let ndwiPot = 0.1;
      let servicios = 0;
      let conectividad = 0.2; // base

      if (tags.natural === 'water' || tags.water) {
        score += 25; tipoDetectado = 'cuerpo_agua'; ndwiPot = 0.85;
        conectividad = 0.7; servicios += 2;
        reasons.push('Cuerpo de agua (OSM)');
      }
      if (tags.natural === 'wetland') {
        score += 35; tipoDetectado = 'humedal_existente'; ndwiPot = 0.7;
        conectividad = 0.9; servicios += 4;
        reasons.push('Humedal natural (OSM)');
      }
      if (tags.waterway) {
        score += 15; tipoDetectado = 'via_acuatica'; ndwiPot = 0.6;
        conectividad = 0.8; servicios += 1;
        reasons.push(`Waterway: ${tags.waterway}`);
      }
      if (tags.man_made === 'wastewater_plant' || tags.amenity === 'wastewater_plant') {
        score += 30; tipoDetectado = 'infraestructura_hidrica'; ndwiPot = 0.5;
        conectividad = 0.6; servicios += 3;
        reasons.push('Planta tratamiento');
      }
      if (tags.landuse === 'basin' || tags.landuse === 'reservoir') {
        score += 20; tipoDetectado = 'vaso_regulador'; ndwiPot = 0.75;
        conectividad = 0.7; servicios += 2;
        reasons.push('Vaso regulador');
      }
      if (tags.leisure === 'park' || tags.landuse === 'grass') {
        score += 10; tipoDetectado = 'area_verde'; ndwiPot = 0.2;
        conectividad = 0.3; servicios += 1;
        reasons.push('Area verde (potencial restauracion)');
      }

      if (areaM2 >= 5000) { score += 15; reasons.push(`Sup. amplia: ${Math.round(areaM2).toLocaleString()} m²`); }
      else if (areaM2 >= 1000) { score += 10; }
      else { score += 5; }

      if (tags.name) { score += 5; reasons.push(`ID: ${tags.name}`); }
      if (score < minScore) continue;

      // Biodiversity potential: wetlands >> water > parks
      let biodiv = 0.2;
      if (tipoDetectado === 'humedal_existente') biodiv = 0.85;
      else if (tipoDetectado === 'cuerpo_agua') biodiv = 0.6;
      else if (tipoDetectado === 'area_verde') biodiv = 0.45;
      else if (tipoDetectado === 'vaso_regulador') biodiv = 0.5;

      // Retention capacity (simplified: 30% of volume for 1m avg depth)
      const retCapacity = areaM2 * 1 * 0.3; // m3

      // Temperature reduction (ref: 1°C per ~20,000 m² water surface)
      const tempRed = Math.min(areaM2 / 20000, 3.5);

      // Soil type estimate
      let tipoSuelo = 'desconocido';
      if (ndwiPot >= 0.6) tipoSuelo = 'lacustre';
      else if (tipoDetectado === 'area_verde') tipoSuelo = 'aluvial';
      else if (tipoDetectado === 'infraestructura_hidrica') tipoSuelo = 'intervenido';

      const indices: HumedalIndices = {
        refId: `OSM-W${way.id}`,
        ndwiPotencial: +ndwiPot.toFixed(3),
        capacidadRetencion: Math.round(retCapacity),
        conectividadHidrica: +conectividad.toFixed(2),
        serviciosEcosistemicos: Math.min(servicios, 5),
        biodiversidadPotencial: +biodiv.toFixed(3),
        perimetroM: Math.round(perimM),
        compacidad: +comp.toFixed(3),
        captacionPluvial: Math.round(areaM2 * 0.8),
        reduccionTemperatura: +tempRed.toFixed(2),
        tipoSuelo,
      };

      candidates.push({
        nombre: tags.name || `${tipoDetectado} (OSM ${way.id})`,
        lat, lng,
        areaM2: Math.round(areaM2),
        score: Math.min(score, 100),
        tipo: tipoDetectado,
        tags, geometry: polygon.geometry, reasons, indices,
      });
    } catch { /* skip */ }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, 200);
}

// ══════════════════════════════════════
//  Public API
// ══════════════════════════════════════

export class DetectorService {
  async runDetection(observatory: string, params: DetectionParams): Promise<DetectedCandidate[]> {
    if (observatory === 'techos-verdes') return detectGreenRoofCandidates(params);
    if (observatory === 'humedales') return detectHumedalCandidates(params);
    throw new Error(`Observatory "${observatory}" not supported`);
  }

  async submitDetectedAsProspects(observatory: string, candidates: DetectedCandidate[], adminId: string) {
    const repo = AppDataSource.getRepository(ProspectSubmission);
    const prospects = candidates.map(c => repo.create({
      observatory,
      status: ProspectStatus.PENDIENTE,
      source: ProspectSource.IA_DETECTOR,
      confianzaDetector: c.score >= 70 ? 'alta' : c.score >= 40 ? 'media' : 'baja',
      data: {
        nombre: c.nombre, lat: c.lat, lng: c.lng, areaM2: c.areaM2,
        score: c.score, tipo: c.tipo, reasons: c.reasons,
        indices: c.indices, geometry: c.geometry,
        osmTags: c.tags, detectedAt: new Date().toISOString(),
      },
    }));
    const saved = await repo.save(prospects);
    return { submitted: saved.length };
  }
}
