// Integración con NASA POWER (https://power.larc.nasa.gov). Endpoint público,
// sin auth, datos en dominio público. Usamos la climatología (medias mensuales y
// anuales) que cambia muy poco en escalas sub-decadales — basta refrescar cada
// pocos meses por arrecife.
import type { ReefClimateData } from '../../../entities/observatory/Reef';

const POWER_BASE = 'https://power.larc.nasa.gov/api/temporal/climatology/point';
const PARAMETERS = ['ALLSKY_SFC_SW_DWN', 'T2M', 'PRECTOTCORR', 'WS10M', 'RH2M'].join(',');
const COMMUNITY = 'RE'; // RE = Renewable Energy. Más estable que SB para irradiación.
const FETCH_TIMEOUT_MS = 20000;

const MONTH_KEYS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const monthlyArray = (block: Record<string, number> | undefined): number[] | null => {
  if (!block) return null;
  const arr = MONTH_KEYS.map((k) => Number(block[k]));
  return arr.every((v) => Number.isFinite(v)) ? arr : null;
};

const annualValue = (block: Record<string, number> | undefined): number | null => {
  if (!block) return null;
  // POWER devuelve la media anual en la clave "ANN".
  const v = Number(block.ANN);
  return Number.isFinite(v) ? v : null;
};

export const fetchReefClimate = async (
  lat: number,
  lng: number,
): Promise<ReefClimateData> => {
  const url =
    `${POWER_BASE}?parameters=${PARAMETERS}` +
    `&community=${COMMUNITY}` +
    `&latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` +
    `&format=JSON`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`NASA POWER HTTP ${res.status}: ${await res.text().catch(() => '')}`);
    }
    const json = (await res.json()) as {
      properties?: { parameter?: Record<string, Record<string, number>> };
    };
    const params = json?.properties?.parameter ?? {};
    return {
      source: 'nasa_power',
      lat,
      lng,
      solarIrradiation: annualValue(params.ALLSKY_SFC_SW_DWN),
      airTemp: annualValue(params.T2M),
      precipitation: annualValue(params.PRECTOTCORR),
      windSpeed: annualValue(params.WS10M),
      relativeHumidity: annualValue(params.RH2M),
      monthly: {
        solarIrradiation: monthlyArray(params.ALLSKY_SFC_SW_DWN) ?? [],
        airTemp: monthlyArray(params.T2M) ?? [],
        precipitation: monthlyArray(params.PRECTOTCORR) ?? [],
      },
    };
  } finally {
    clearTimeout(timer);
  }
};
