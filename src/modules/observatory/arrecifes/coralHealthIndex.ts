// Coral Health Index 0–100 (mayor = mejor). Composite ponderado inspirado en la
// metodología de Healthy Reefs Initiative, adaptado a las variables del
// observatorio. Misma fórmula que el frontend (`useAnalyticsMath.ts`) — esta
// versión existe para que el backend pueda persistir snapshots con CHI ya
// calculado y consumidores externos (mobile, partners) reciban el mismo número.

const PROTECTION_SCORE: Record<string, number> = {
  unesco: 100,
  anp_federal: 85,
  ramsar: 80,
  anp_state: 70,
  unprotected: 0,
};

export interface CoralHealthInput {
  liveCoralCover?: number | null;
  dhw?: number | null;
  protection?: string | null;
  threats?: string[] | null;
  speciesRichness?: number | null;
}

export const computeCoralHealthIndex = (r: CoralHealthInput): number => {
  const components: { value: number; weight: number }[] = [];

  const cover = Number(r.liveCoralCover);
  if (Number.isFinite(cover)) {
    components.push({ value: Math.min(100, cover * 2), weight: 0.4 });
  }

  const dhw = Number(r.dhw);
  if (Number.isFinite(dhw)) {
    components.push({
      value: Math.max(0, 100 - Math.min(100, dhw * 12.5)),
      weight: 0.2,
    });
  }

  if (r.protection) {
    components.push({
      value: PROTECTION_SCORE[r.protection] ?? 50,
      weight: 0.15,
    });
  }

  if (Array.isArray(r.threats)) {
    components.push({
      value: Math.max(0, 100 - r.threats.length * 15),
      weight: 0.15,
    });
  }

  const sr = Number(r.speciesRichness);
  if (Number.isFinite(sr)) {
    components.push({ value: Math.min(100, (sr / 80) * 100), weight: 0.1 });
  }

  if (components.length === 0) return 0;
  const w = components.reduce((s, c) => s + c.weight, 0);
  return components.reduce((s, c) => s + c.value * (c.weight / w), 0);
};
