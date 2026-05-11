import crypto from 'crypto';
import { AppDataSource } from '../../../ormconfig';
import { InteractionEvent, InteractionEventType } from '../../../entities/observatory/InteractionEvent';
import { AppError } from '../../../middleware/errorHandler.middleware';

const repo = () => AppDataSource.getRepository(InteractionEvent);

const VALID_OBSERVATORIES = new Set(['arrecifes', 'humedales', 'techos-verdes']);
const VALID_TYPES: InteractionEventType[] = [
  'pageview', 'click', 'submit', 'search', 'filter', 'download', 'external_link', 'custom',
];

const truncate = (value: unknown, max: number): string | null => {
  if (typeof value !== 'string' || !value) return null;
  return value.length > max ? value.slice(0, max) : value;
};

const hashIp = (ip: string | undefined | null): string | null => {
  if (!ip) return null;
  const salt = process.env.EVENTS_IP_SALT || 'cercu-observatory-events';
  return crypto.createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
};

interface IngestEvent {
  type: InteractionEventType;
  path?: string;
  target?: string;
  sessionId: string;
  metadata?: Record<string, unknown>;
  referrer?: string;
}

interface IngestContext {
  observatory: string;
  ip?: string;
  userAgent?: string;
  userId?: string | null;
}

export class EventsService {
  async ingest(events: IngestEvent[], ctx: IngestContext) {
    if (!VALID_OBSERVATORIES.has(ctx.observatory)) {
      throw new AppError('Observatorio inválido', 400);
    }
    if (!Array.isArray(events) || events.length === 0) {
      throw new AppError('events[] vacío', 400);
    }
    if (events.length > 50) {
      throw new AppError('Lote demasiado grande (máx 50)', 400);
    }

    const ipHash = hashIp(ctx.ip);
    const ua = truncate(ctx.userAgent, 250);

    // Normaliza el path antes de persistir (quita query/hash) — alinea con
    // el cliente nuevo y blinda contra clientes legacy o curl manual que
    // mandan paths con query string. También captura `referrer` para
    // filtros adicionales si fuera necesario.
    const canonicalize = (p: string | null | undefined): string | null => {
      if (!p) return null;
      return p.split('?')[0].split('#')[0] || '/';
    };

    // Defensa en profundidad: rechaza eventos cuyo PATH apunte al panel admin.
    // El cliente ya los filtra (`useTracking.isInternalPath`), pero alguien
    // con devtools o un fetch manual podría seguir mandándolos. Aquí los
    // descartamos silenciosamente (no error 400) — el cliente no debe saber
    // si entraron o no, sólo que el batch fue aceptado.
    const isInternalPath = (p: string | null): boolean => {
      if (!p) return false;
      return p === '/admin' || p.startsWith('/admin/');
    };

    const records = events
      .filter((e) => e && VALID_TYPES.includes(e.type) && typeof e.sessionId === 'string' && e.sessionId.length > 0)
      .map((e) => ({ ...e, path: canonicalize(truncate(e.path, 250) as any) }))
      .filter((e) => !isInternalPath(e.path))
      .map((e) =>
        repo().create({
          observatory: ctx.observatory,
          eventType: e.type,
          path: e.path,
          target: truncate(e.target, 250),
          sessionId: e.sessionId.slice(0, 64),
          userId: ctx.userId || null,
          metadata: e.metadata && typeof e.metadata === 'object' ? e.metadata : null,
          referrer: truncate(e.referrer, 250),
          userAgent: ua,
          ipHash,
        }),
      );

    if (records.length === 0) {
      return { saved: 0 };
    }

    await repo().save(records);
    return { saved: records.length };
  }

  async getSummary(observatory: string, days = 30) {
    const from = new Date();
    from.setDate(from.getDate() - days);
    from.setHours(0, 0, 0, 0);
    const to = new Date();

    // Raw query para evitar cualquier raresa de TypeORM con DATETIME(6) en MySQL.
    const fromStr = from.toISOString().slice(0, 19).replace('T', ' ');
    const toStr = to.toISOString().slice(0, 19).replace('T', ' ');
    // Excluye tráfico interno del panel admin. Triple filtro:
    //   1. path empieza con `/admin/` (incluyendo `/admin` exacto)
    //   2. ingest backend ya rechaza estos pero el SQL filtra el legacy
    //   3. eventos con path NULL que apuntan a /admin (raros) también fuera
    // El cliente nuevo manda paths normalizados sin query, pero filtramos
    // también con `LIKE '/admin/%'` y `= '/admin'` para cubrir histórico
    // que pudiera tener `?param=...`.
    const events: AggregateEvent[] = await repo().query(
      `SELECT eventType, path, target, sessionId, createdAt
         FROM observatory_interaction_events
        WHERE observatory = ?
          AND createdAt >= ?
          AND createdAt <= ?
          AND path IS NOT NULL
          AND path <> '/admin'
          AND path NOT LIKE '/admin/%'
          AND path NOT LIKE '/admin?%'
          AND path NOT LIKE '/admin#%'
        ORDER BY createdAt ASC`,
      [observatory, fromStr, toStr],
    );

    const aggregated = aggregateEvents(events, days);
    return { observatory, from: from.toISOString(), to: to.toISOString(), ...aggregated };
  }
}

// Tipo del evento crudo necesario para agregación. Aislado para que
// `aggregateEvents` sea una función pura testable sin TypeORM.
export interface AggregateEvent {
  eventType: string;
  path: string | null;
  target: string | null;
  sessionId: string;
  createdAt: Date | string;
}

/**
 * Agregación pura de eventos para el endpoint /admin/analytics/summary.
 *
 * **Clave del fix de pageviews**: el conteo `totals.pageviews` está
 * deduplicado por la triple `(sessionId, día, path canónico)`. Esto significa:
 *
 * - Una misma sesión recargando `/inventario` 5 veces el mismo día → 1 pageview
 * - La misma sesión visitando `/inventario` un día y otro día distinto → 2 pageviews
 * - La misma sesión visitando `/inventario` y luego `/mapa` el mismo día → 2 pageviews
 * - Dos sesiones distintas visitando `/inventario` el mismo día → 2 pageviews
 *
 * Cuando se cumple un match en la dedup, `totals.pageviewsRaw` sigue contando
 * el evento — útil para distinguir "tráfico de calidad" (sesiones × páginas)
 * de "engagement intra-sesión" (cuántas veces recargan dentro de la misma
 * sesión-día-path).
 *
 * `topPaths` también está deduplicado: la "popularidad" de cada path se mide
 * en sesiones únicas por día, no en eventos raw.
 */
export function aggregateEvents(events: AggregateEvent[], days: number) {
    const total = events.length;

    // Aggregations
    const byType: Record<string, number> = {};
    const byDay: Record<string, number> = {};
    const byPath: Record<string, number> = {};
    const byTarget: Record<string, number> = {};
    const sessions = new Set<string>();
    const sessionsByDay: Record<string, Set<string>> = {};

    // Para deduplicación de pageviews: la clave única es `sessionId|day|path`.
    // De esta forma una misma sesión recargando `/inventario` 5 veces el mismo
    // día cuenta como **1 pageview único** (no 5). Visitas a `/inventario` en
    // días distintos sí cuentan separado; visitas a paths diferentes en el
    // mismo día también cuentan separado.
    //
    // Si en el futuro se quiere mayor granularidad (ej. 30 min de ventana en
    // lugar de un día), se cambia la composición de la clave. Por ahora, día
    // completo coincide con la convención de Plausible / Google Analytics
    // para "unique pageviews".
    const uniquePageviewKeys = new Set<string>();
    const uniquePageviewByDay: Record<string, Set<string>> = {};
    const uniquePageviewByPath: Record<string, Set<string>> = {};

    let pageviewsRaw = 0;

    for (const ev of events) {
      byType[ev.eventType] = (byType[ev.eventType] || 0) + 1;
      // mysql2 driver puede devolver Date o string. Normalizamos a YYYY-MM-DD
      let dayKey: string;
      if (ev.createdAt instanceof Date) {
        dayKey = ev.createdAt.toISOString().slice(0, 10);
      } else if (typeof ev.createdAt === 'string') {
        // Format esperado: '2026-05-07 18:32:52.005895'
        dayKey = ev.createdAt.slice(0, 10);
      } else {
        dayKey = new Date(ev.createdAt).toISOString().slice(0, 10);
      }
      byDay[dayKey] = (byDay[dayKey] || 0) + 1;
      sessions.add(ev.sessionId);
      if (!sessionsByDay[dayKey]) sessionsByDay[dayKey] = new Set();
      sessionsByDay[dayKey].add(ev.sessionId);

      if (ev.eventType === 'pageview' && ev.path) {
        pageviewsRaw += 1;
        // Normaliza el path: quita query string y hash para que `/livemap?
        // ocean=caribbean` y `/livemap?status=alert` cuenten como la misma
        // ruta. El cliente nuevo ya manda paths normalizados, esto cubre el
        // histórico que entró antes del fix.
        const canonical = ev.path.split('?')[0].split('#')[0] || '/';

        // Dedup: (sessionId, day, path)
        const key = `${ev.sessionId}|${dayKey}|${canonical}`;
        if (!uniquePageviewKeys.has(key)) {
          uniquePageviewKeys.add(key);
          // Conteo por día (para series)
          if (!uniquePageviewByDay[dayKey]) uniquePageviewByDay[dayKey] = new Set();
          uniquePageviewByDay[dayKey].add(`${ev.sessionId}|${canonical}`);
          // Conteo por path (para topPaths) — cuenta sesiones únicas por día
          if (!uniquePageviewByPath[canonical]) uniquePageviewByPath[canonical] = new Set();
          uniquePageviewByPath[canonical].add(`${ev.sessionId}|${dayKey}`);
          // byPath final = tamaño del set (sesiones únicas por día visitando este path)
          byPath[canonical] = uniquePageviewByPath[canonical].size;
        }
      }
      if (ev.eventType === 'click' && ev.target) {
        byTarget[ev.target] = (byTarget[ev.target] || 0) + 1;
      }
    }

    const pageviewsUnique = uniquePageviewKeys.size;

    // Build complete day series (no gaps) for the last `days` days
    const series: { date: string; events: number; sessions: number; pageviews: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      series.push({
        date: key,
        events: byDay[key] || 0,
        sessions: sessionsByDay[key]?.size || 0,
        pageviews: uniquePageviewByDay[key]?.size || 0,
      });
    }

    const top = (rec: Record<string, number>, n = 10) =>
      Object.entries(rec)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([key, count]) => ({ key, count }));

    return {
      days,
      totals: {
        events: total,
        sessions: sessions.size,
        // pageviews por defecto = únicos (deduplicados por sessionId+día+path).
        // Una recarga del mismo path por la misma sesión en el mismo día NO
        // suma. Esto evita inflación del número por reloads, F5 espontáneos o
        // navegación de ida-vuelta en SPA.
        pageviews: pageviewsUnique,
        // pageviewsRaw conserva el conteo crudo (cada evento es un +1). Útil
        // para distinguir "tráfico de calidad" vs "engagement intra-sesión".
        pageviewsRaw,
        clicks: byType['click'] || 0,
        submits: byType['submit'] || 0,
        downloads: byType['download'] || 0,
      },
      byType,
      series,
      topPaths: top(byPath, 10),
      topTargets: top(byTarget, 10),
    };
}
