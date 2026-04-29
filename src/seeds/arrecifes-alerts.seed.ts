import { AppDataSource } from '../ormconfig';
import { ObsBleachingAlert } from '../entities/observatory/BleachingAlert';

// Snapshot NOAA Coral Reef Watch para los 12 arrecifes mexicanos.
// Valores realistas basados en el contexto 2026 (calentamiento sostenido,
// SAM en alerta tras blanqueamiento masivo del 2024-2025).
// `level` mapea a la escala oficial NOAA CRW BAA:
//   no_stress → DHW < 1     (ningún stress térmico)
//   watch     → DHW 1-2     (stress térmico bajo)
//   warning   → DHW 2-4     (estrés térmico significativo)
//   alert_1   → DHW 4-8     (blanqueamiento esperado)
//   alert_2   → DHW > 8     (mortalidad probable)
const ALERTS = [
  // Caribe — el SAM enfrenta estrés térmico crónico tras 2024
  { reefId: 1,  level: 'warning',  dhw: 3.2, sst: 30.4, sstAnomaly: 1.4 }, // Puerto Morelos
  { reefId: 2,  level: 'alert_1',  dhw: 5.1, sst: 30.7, sstAnomaly: 1.7 }, // Cozumel
  { reefId: 3,  level: 'watch',    dhw: 1.6, sst: 29.8, sstAnomaly: 0.9 }, // Chinchorro
  { reefId: 5,  level: 'no_stress', dhw: 0.4, sst: 29.1, sstAnomaly: 0.3 }, // Xcalak
  { reefId: 11, level: 'watch',    dhw: 1.8, sst: 30.0, sstAnomaly: 1.0 }, // Contoy

  // Golfo de México
  { reefId: 4,  level: 'alert_1',  dhw: 5.6, sst: 30.9, sstAnomaly: 1.9 }, // SAV
  { reefId: 9,  level: 'watch',    dhw: 1.4, sst: 29.6, sstAnomaly: 0.8 }, // Alacranes

  // Pacífico — gradiente latitudinal: sur cálido, norte BCS templado
  { reefId: 6,  level: 'no_stress', dhw: 0.2, sst: 27.4, sstAnomaly: 0.2 }, // Cabo Pulmo
  { reefId: 7,  level: 'watch',    dhw: 1.5, sst: 28.6, sstAnomaly: 0.9 }, // Isla Isabel
  { reefId: 8,  level: 'no_stress', dhw: 0.5, sst: 26.9, sstAnomaly: 0.4 }, // Revillagigedo
  { reefId: 10, level: 'warning',  dhw: 2.7, sst: 29.8, sstAnomaly: 1.3 }, // Huatulco
  { reefId: 12, level: 'no_stress', dhw: 0.3, sst: 26.5, sstAnomaly: 0.2 }, // Espíritu Santo
];

export async function seedArrecifesAlerts() {
  const repo = AppDataSource.getRepository(ObsBleachingAlert);
  // Limpia alertas previas para evitar duplicados acumulados
  await repo.clear().catch(() => undefined);
  const observedAt = new Date();
  for (const a of ALERTS) {
    await repo.save(
      repo.create({
        ...a,
        observedAt,
        source: 'noaa_crw',
        productUrl: 'https://coralreefwatch.noaa.gov/product/5km/',
      } as any),
    );
  }
  console.log(`✅ Seeded arrecifes-alerts: ${ALERTS.length} alertas blanqueamiento`);
}
