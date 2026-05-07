// Genera 6 meses de snapshots históricos por arrecife. Datos sintéticos pero
// calibrados (rangos realistas para SAM, Pacífico, Golfo): permiten que la
// pestaña Modelado tenga señal para correr Mann-Kendall, regresión temporal
// y forecast desde la primera carga.
//
// Idempotente: chequea por (reefId, capturedAt) antes de insertar. Si la tabla
// ya tiene snapshots reales (de runs manuales), se conservan.
import { AppDataSource } from '../ormconfig';
import { ObsReef } from '../entities/observatory/Reef';
import { ObsReefMetricSnapshot } from '../entities/observatory/ReefMetricSnapshot';
import { computeCoralHealthIndex } from '../modules/observatory/arrecifes/coralHealthIndex';

const MONTHS_BACK = 6;
const SAMPLES_PER_MONTH = 1; // 1 snapshot por mes ≈ 6 puntos por reef

// Tendencia mensual (pp / mes) en cobertura coral por litoral. Caribe en
// declive moderado, Pacífico estable, Golfo estable con variabilidad mayor.
const TREND_BY_OCEAN: Record<string, number> = {
  caribbean: -0.12,
  gulf_of_mexico: -0.05,
  pacific: -0.02,
};

// Variabilidad estacional del DHW (°C·sem) — aproximación: pico en agosto,
// valle en febrero. Modulado por amplitud distinta por litoral (Caribe sufre
// más estrés térmico en verano que el Pacífico mexicano).
const DHW_AMPLITUDE: Record<string, number> = {
  caribbean: 4.5,
  gulf_of_mexico: 3.5,
  pacific: 1.5,
};

const DHW_BASELINE: Record<string, number> = {
  caribbean: 1.2,
  gulf_of_mexico: 0.8,
  pacific: 0.3,
};

// SST media por litoral (°C). El año oscila ±2 °C alrededor.
const SST_MEAN: Record<string, number> = {
  caribbean: 28.5,
  gulf_of_mexico: 27.0,
  pacific: 25.5,
};

// PRNG determinista (mulberry32) para que la seed sea reproducible: dos corridas
// del seeder generan los mismos números, evitando que el dataset cambie.
const seedPRNG = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export async function seedArrecifesSnapshots() {
  const reefRepo = AppDataSource.getRepository(ObsReef);
  const snapRepo = AppDataSource.getRepository(ObsReefMetricSnapshot);

  const reefs = await reefRepo.find();
  if (reefs.length === 0) {
    console.log('  ObsReefMetricSnapshot: no reefs to snapshot, skipping');
    return;
  }

  const today = new Date();
  let created = 0;
  let skipped = 0;

  for (const r of reefs) {
    const ocean = r.ocean || 'caribbean';
    const trend = TREND_BY_OCEAN[ocean] ?? 0;
    const dhwAmp = DHW_AMPLITUDE[ocean] ?? 2.5;
    const dhwBase = DHW_BASELINE[ocean] ?? 0.5;
    const sstMean = SST_MEAN[ocean] ?? 27.0;

    const baseCover = Number(r.liveCoralCover) || 20;
    // PRNG por reef para que el ruido del Caribe no sea idéntico al del Pacífico
    // pero sí reproducible.
    const rand = seedPRNG(r.id * 7919);

    for (let monthsAgo = MONTHS_BACK - 1; monthsAgo >= 0; monthsAgo--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - monthsAgo);
      date.setDate(15); // mid-month para evitar bordes raros
      const capturedAt = date.toISOString().slice(0, 10);

      const exists = await snapRepo.findOne({
        where: { reefId: r.id, capturedAt },
      });
      if (exists) {
        skipped++;
        continue;
      }

      // Mes 0–11; usamos para componente estacional sinusoidal
      const monthIdx = date.getMonth();
      const seasonalRad = ((monthIdx - 1) / 12) * 2 * Math.PI; // pico ~agosto

      // Cobertura: punto de partida + tendencia × meses transcurridos + ruido
      // gaussiano (Box-Muller) ±1 pp.
      const u1 = Math.max(rand(), 1e-9);
      const u2 = rand();
      const noise = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const cover = Math.max(
        0,
        Math.min(60, baseCover + trend * (MONTHS_BACK - 1 - monthsAgo) + noise * 0.8),
      );

      const dhw = Math.max(
        0,
        dhwBase + dhwAmp * Math.sin(seasonalRad - Math.PI / 2) * (0.6 + rand() * 0.4),
      );

      const sst = sstMean + 2 * Math.sin(seasonalRad - Math.PI / 2) + (rand() - 0.5) * 0.6;
      const sstAnomaly = (rand() - 0.5) * 1.2 + (dhw > 2 ? 0.4 : 0);

      const chi = computeCoralHealthIndex({
        liveCoralCover: cover,
        dhw,
        protection: r.protection,
        threats: r.threats,
        speciesRichness: r.speciesRichness,
      });

      await snapRepo.save(
        snapRepo.create({
          reefId: r.id,
          capturedAt,
          liveCoralCover: round2(cover),
          dhw: round2(dhw),
          sst: round2(sst),
          sstAnomaly: round2(sstAnomaly),
          observationsCount: r.observations || 0,
          healthIndex: round2(chi),
          source: 'seed',
        }),
      );
      created++;
    }
  }

  console.log(
    `  ObsReefMetricSnapshot: ${created} snapshot(s) creado(s), ${skipped} ya existía(n).`,
  );
}
