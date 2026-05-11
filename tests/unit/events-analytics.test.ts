import { describe, it, expect } from 'vitest'
import {
  aggregateEvents,
  type AggregateEvent,
} from '../../src/modules/observatory/events/events.service'

// Helper para construir un evento — todos los campos opcionales tienen
// valores razonables.
function ev(opts: Partial<AggregateEvent> & { type?: string; day?: string; time?: string }): AggregateEvent {
  const day = opts.day ?? '2026-05-01'
  const time = opts.time ?? '12:00:00'
  // OJO: NO usar `??` con `path` porque queremos permitir `null` explícito
  // (caso de pageview sin path para probar robustez).
  const path = 'path' in opts ? (opts.path ?? null) : '/'
  return {
    eventType: opts.type ?? opts.eventType ?? 'pageview',
    path,
    target: opts.target ?? null,
    sessionId: opts.sessionId ?? 'session-a',
    createdAt: opts.createdAt ?? `${day} ${time}`,
  }
}

describe('aggregateEvents — deduplicación de pageviews', () => {
  it('una misma sesión recargando el mismo path el mismo día cuenta 1 pageview único', () => {
    const events = [
      ev({ path: '/inventario', time: '10:00:00' }),
      ev({ path: '/inventario', time: '10:01:00' }),
      ev({ path: '/inventario', time: '10:02:00' }),
      ev({ path: '/inventario', time: '10:03:00' }),
      ev({ path: '/inventario', time: '10:04:00' }),
    ]
    const result = aggregateEvents(events, 30)
    expect(result.totals.pageviews).toBe(1)
    expect(result.totals.pageviewsRaw).toBe(5)
    expect(result.totals.events).toBe(5)
  })

  it('la misma sesión visitando el mismo path en días distintos cuenta separado', () => {
    const events = [
      ev({ path: '/inventario', day: '2026-05-01' }),
      ev({ path: '/inventario', day: '2026-05-02' }),
      ev({ path: '/inventario', day: '2026-05-03' }),
    ]
    const result = aggregateEvents(events, 30)
    expect(result.totals.pageviews).toBe(3)
    expect(result.totals.pageviewsRaw).toBe(3)
  })

  it('la misma sesión visitando paths distintos el mismo día cuenta separado', () => {
    const events = [
      ev({ path: '/inventario' }),
      ev({ path: '/mapa' }),
      ev({ path: '/candidatos' }),
    ]
    const result = aggregateEvents(events, 30)
    expect(result.totals.pageviews).toBe(3)
    expect(result.totals.pageviewsRaw).toBe(3)
    expect(result.totals.sessions).toBe(1)
  })

  it('sesiones distintas visitando el mismo path el mismo día cuentan separado', () => {
    const events = [
      ev({ path: '/inventario', sessionId: 'sa' }),
      ev({ path: '/inventario', sessionId: 'sb' }),
      ev({ path: '/inventario', sessionId: 'sc' }),
    ]
    const result = aggregateEvents(events, 30)
    expect(result.totals.pageviews).toBe(3)
    expect(result.totals.sessions).toBe(3)
  })

  it('caso mixto: 3 sesiones, cada una recarga 2 paths múltiples veces el mismo día', () => {
    const events: AggregateEvent[] = []
    for (const s of ['s1', 's2', 's3']) {
      for (const p of ['/inventario', '/mapa']) {
        for (let i = 0; i < 4; i++) {
          events.push(ev({ sessionId: s, path: p, time: `12:0${i}:00` }))
        }
      }
    }
    // 3 × 2 × 4 = 24 eventos raw, pero solo 6 pageviews únicos
    const result = aggregateEvents(events, 30)
    expect(result.totals.pageviewsRaw).toBe(24)
    expect(result.totals.pageviews).toBe(6) // 3 sesiones × 2 paths
    expect(result.totals.sessions).toBe(3)
  })

  it('query strings y hashes en el path se normalizan (canónico)', () => {
    const events = [
      ev({ path: '/mapa' }),
      ev({ path: '/mapa?filter=plano' }),
      ev({ path: '/mapa#zona-norte' }),
      ev({ path: '/mapa?alcaldia=GAM&filter=plano' }),
    ]
    const result = aggregateEvents(events, 30)
    expect(result.totals.pageviews).toBe(1) // todos colapsan a /mapa
    expect(result.totals.pageviewsRaw).toBe(4)
  })
})

describe('aggregateEvents — topPaths deduplicado', () => {
  it('topPaths cuenta sesiones únicas por día por path, no eventos raw', () => {
    const events: AggregateEvent[] = []
    // Sesión A recarga /inventario 10 veces el mismo día
    for (let i = 0; i < 10; i++) events.push(ev({ sessionId: 'sa', path: '/inventario', time: `12:0${i}:00` }))
    // Sesión B visita /inventario 1 vez
    events.push(ev({ sessionId: 'sb', path: '/inventario' }))
    // Sesión C visita /mapa 1 vez
    events.push(ev({ sessionId: 'sc', path: '/mapa' }))

    const result = aggregateEvents(events, 30)
    const inv = result.topPaths.find((p) => p.key === '/inventario')
    const mapa = result.topPaths.find((p) => p.key === '/mapa')
    expect(inv?.count).toBe(2) // 2 sesiones únicas, no 11 eventos
    expect(mapa?.count).toBe(1)
  })

  it('topPaths ordena descendente por sesiones únicas', () => {
    const events: AggregateEvent[] = [
      ...['sa', 'sb', 'sc', 'sd'].map((s) => ev({ sessionId: s, path: '/mapa' })),
      ...['sa', 'sb'].map((s) => ev({ sessionId: s, path: '/inventario' })),
      ev({ sessionId: 'sa', path: '/sobre' }),
    ]
    const result = aggregateEvents(events, 30)
    expect(result.topPaths[0].key).toBe('/mapa')
    expect(result.topPaths[0].count).toBe(4)
    expect(result.topPaths[1].key).toBe('/inventario')
    expect(result.topPaths[1].count).toBe(2)
  })
})

describe('aggregateEvents — series por día', () => {
  it('series incluye pageviews únicos por día y rellena días sin tráfico', () => {
    const events = [
      ev({ path: '/inventario', day: '2026-05-01' }),
      ev({ path: '/inventario', day: '2026-05-01' }), // dupe — debe contar 1 en el día
      ev({ path: '/mapa', day: '2026-05-01' }),
    ]
    const result = aggregateEvents(events, 30)
    const day = result.series.find((s) => s.date === '2026-05-01')
    expect(day?.pageviews).toBe(2) // /inventario + /mapa, sin doble conteo
    expect(day?.events).toBe(3) // raw events count
  })

  it('cada día reportado tiene 4 campos: date, events, sessions, pageviews', () => {
    const result = aggregateEvents([], 7)
    expect(result.series.length).toBe(7)
    for (const day of result.series) {
      expect(day).toHaveProperty('date')
      expect(day).toHaveProperty('events')
      expect(day).toHaveProperty('sessions')
      expect(day).toHaveProperty('pageviews')
    }
  })
})

describe('aggregateEvents — otros tipos de evento', () => {
  it('clicks y submits no se confunden con pageviews', () => {
    const events = [
      ev({ type: 'pageview', path: '/inventario' }),
      ev({ type: 'click', target: 'btn-filter' }),
      ev({ type: 'click', target: 'btn-filter' }), // mismo target, sí cuenta 2 clicks
      ev({ type: 'submit', target: 'form-aporte' }),
    ]
    const result = aggregateEvents(events, 30)
    expect(result.totals.pageviews).toBe(1)
    expect(result.totals.pageviewsRaw).toBe(1)
    expect(result.totals.clicks).toBe(2)
    expect(result.totals.submits).toBe(1)
  })

  it('topTargets cuenta eventos raw (no se deduplica)', () => {
    const events = [
      ev({ type: 'click', target: 'btn-mapa' }),
      ev({ type: 'click', target: 'btn-mapa' }),
      ev({ type: 'click', target: 'btn-mapa' }),
      ev({ type: 'click', target: 'btn-otro' }),
    ]
    const result = aggregateEvents(events, 30)
    const mapa = result.topTargets.find((t) => t.key === 'btn-mapa')
    expect(mapa?.count).toBe(3)
  })
})

describe('aggregateEvents — robustez', () => {
  it('events vacío devuelve totales en cero pero series del tamaño correcto', () => {
    const result = aggregateEvents([], 14)
    expect(result.totals.events).toBe(0)
    expect(result.totals.pageviews).toBe(0)
    expect(result.totals.pageviewsRaw).toBe(0)
    expect(result.series.length).toBe(14)
  })

  it('pageviews sin path no rompen la agregación', () => {
    const events = [
      ev({ type: 'pageview', path: null }),
      ev({ type: 'pageview', path: '/' }),
    ]
    const result = aggregateEvents(events, 30)
    // El null no debe contar para pageviewsRaw ni para únicos
    expect(result.totals.pageviewsRaw).toBe(1)
    expect(result.totals.pageviews).toBe(1)
  })

  it('createdAt como Date funciona igual que createdAt como string', () => {
    const events = [
      ev({ path: '/x', createdAt: new Date('2026-05-01T10:00:00Z') }),
      ev({ path: '/x', createdAt: '2026-05-01 10:01:00' }),
    ]
    const result = aggregateEvents(events, 30)
    expect(result.totals.pageviews).toBe(1) // mismo día + sesión + path
    expect(result.totals.pageviewsRaw).toBe(2)
  })
})
