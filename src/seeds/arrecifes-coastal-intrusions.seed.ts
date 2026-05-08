// Demo seeder: 2 detecciones sintéticas en Puerto Morelos y Cabo Pulmo para
// que el panel admin tenga algo que mostrar antes de correr el detector real.
// Idempotente — si ya hay detecciones (sintéticas o reales) no añade nada.
import { AppDataSource } from '../ormconfig';
import { ObsReef } from '../entities/observatory/Reef';
import { ObsCoastalIntrusion } from '../entities/observatory/CoastalIntrusion';

interface DemoIntrusion {
  reefName: string;
  osmId: string;
  osmTags: Record<string, string>;
  centroidLat: number;
  centroidLng: number;
  areaM2: number;
  zofematOverlapPct: number;
  // Mini polígono cuadrado de ~30m centrado en el centroide
}

const DEMO: DemoIntrusion[] = [
  {
    reefName: 'Arrecife de Puerto Morelos',
    osmId: 'way/seed_demo_001',
    osmTags: { building: 'hotel', name: 'Estructura demo (semilla)' },
    centroidLat: 20.8398,
    centroidLng: -86.8762,
    areaM2: 420.0,
    zofematOverlapPct: 65.0,
  },
  {
    reefName: 'Cabo Pulmo',
    osmId: 'way/seed_demo_002',
    osmTags: { building: 'commercial', name: 'Estructura demo (semilla)' },
    centroidLat: 23.4422,
    centroidLng: -109.4281,
    areaM2: 180.0,
    zofematOverlapPct: 30.0,
  },
];

const squarePolygon = (lat: number, lng: number, sideMeters = 30) => {
  // Aproximación rápida: 1° lat ≈ 111 km, 1° lng ≈ 111·cos(lat) km.
  const dLat = sideMeters / 2 / 111000;
  const dLng = sideMeters / 2 / (111000 * Math.cos((lat * Math.PI) / 180));
  return {
    type: 'Polygon' as const,
    coordinates: [[
      [lng - dLng, lat - dLat],
      [lng + dLng, lat - dLat],
      [lng + dLng, lat + dLat],
      [lng - dLng, lat + dLat],
      [lng - dLng, lat - dLat],
    ]],
  };
};

export async function seedArrecifesCoastalIntrusions() {
  const reefRepo = AppDataSource.getRepository(ObsReef);
  const intrusionRepo = AppDataSource.getRepository(ObsCoastalIntrusion);

  if ((await intrusionRepo.count()) > 0) {
    console.log('  ObsCoastalIntrusion: ya hay detecciones, skip');
    return;
  }

  let created = 0;
  for (const d of DEMO) {
    const reef = await reefRepo.findOne({ where: { name: d.reefName } });
    if (!reef) continue;
    await intrusionRepo.save(
      intrusionRepo.create({
        reefId: reef.id,
        osmId: d.osmId,
        osmTags: d.osmTags,
        geometry: squarePolygon(d.centroidLat, d.centroidLng, Math.sqrt(d.areaM2) || 30) as any,
        centroidLat: d.centroidLat,
        centroidLng: d.centroidLng,
        areaM2: d.areaM2,
        zofematOverlapPct: d.zofematOverlapPct,
        status: 'candidate',
        source: 'seed_demo',
        detectedAt: new Date(),
      }),
    );
    created++;
  }
  console.log(`  ObsCoastalIntrusion: ${created} detección(es) demo creada(s)`);
}
