// Scraper de https://es.mongabay.com/list/mexico/ — noticias ambientales de
// México con perspectiva de conservación. Parsea el listado y filtra por
// keywords relevantes a humedales para reducir ruido en la cola de revisión.
//
// Filosofía: el scraper sólo *propone*. Nada se publica automáticamente — cada
// prospecto entra a `obs_prospecto_noticias` con estado `pendiente` y un
// administrador valida en el panel. El crédito al autor original se conserva
// (`fuente`, `url`) y se inyecta en el cuerpo del artículo al aprobar.
import crypto from 'crypto';
import { AppDataSource } from '../../../ormconfig';
import { ObsProspectoNoticia } from '../../../entities/observatory/ProspectoNoticia';

const LIST_URL = 'https://es.mongabay.com/list/mexico/';
const SOURCE_LABEL = 'Mongabay Latam';
const FETCH_TIMEOUT_MS = 20000;
const USER_AGENT =
  'Mozilla/5.0 (compatible; ObservatorioHumedalesBot/1.0; +https://humedales.cercu.com.mx)';

// Palabras clave (sin acentos, lower-case) que sugieren relevancia para humedales.
// Si el título o URL contiene alguna, el item se promueve a prospecto.
const RELEVANCE_KEYWORDS = [
  'humedal', 'humedales', 'manglar', 'manglares', 'cienaga', 'cenote', 'cenotes',
  'marisma', 'pantano', 'estero', 'esteros', 'laguna', 'lagunas', 'lago',
  'rio', 'rios', 'cuenca', 'cuencas', 'agua', 'aguas', 'acuifero', 'acuiferos',
  'ramsar', 'tortuga', 'tortugas', 'pesca', 'pesquero', 'pesquera', 'pescador',
  'manati', 'cocodrilo', 'flamenco', 'ave acuatica', 'aves acuaticas',
  'sargazo', 'arrecife', 'arrecifes', 'coral', 'corales', 'oceano', 'mar',
  'costa', 'costera', 'costero', 'litoral', 'mangle', 'pesqueria',
  'contaminacion', 'aguas residuales', 'sequia', 'inundacion',
  // específicos de geografía mexicana acuática
  'sian kaan', 'cuatro cienegas', 'xochimilco', 'usumacinta', 'grijalva',
  'pantanos de centla', 'cuyutlan', 'marismas nacionales', 'terminos',
];

const repo = () => AppDataSource.getRepository(ObsProspectoNoticia);

// Decode entidades HTML básicas que aparecen en títulos de mongabay.
const decodeEntities = (s: string): string =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));

const stripTags = (s: string): string => s.replace(/<[^>]+>/g, '').trim();

const sha256 = (s: string): string =>
  crypto.createHash('sha256').update(s).digest('hex');

// Normaliza la URL para deduplicar (sin trailing slash, sin query, lower-case host).
const normalizeUrl = (url: string): string => {
  try {
    const u = new URL(url);
    u.hash = '';
    u.search = '';
    return `${u.protocol}//${u.host.toLowerCase()}${u.pathname.replace(/\/+$/, '')}`;
  } catch {
    return url.trim();
  }
};

// Mapa unificado: nombre completo y abreviatura (3 letras) → número de mes.
// Mongabay usa abreviaturas en español ("Abr", "May", "Ago", "Dic"); incluimos
// también las inglesas por si el feed alterna idioma.
const MONTH_LOOKUP: Record<string, number> = {
  // Español — completos
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10,
  noviembre: 11, diciembre: 12,
  // Español — abreviaturas
  ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6,
  jul: 7, ago: 8, sep: 9, sept: 9, oct: 10, nov: 11, dic: 12,
  // Inglés — abreviaturas (mayo es "may" igual; sep/sept; etc.)
  jan: 1, apr: 4, aug: 8, dec: 12,
};

// Convierte "7 May 2026" / "5 Abr 2026" / "7 de mayo de 2026" → "2026-05-07".
// Si falla, extrae YYYY-MM del URL `/YYYY/MM/...` y usa día 01.
const parseDate = (raw: string, fallbackUrl: string): string => {
  const cleaned = raw.toLowerCase().replace(/\s+de\s+/g, ' ').trim();
  const m = cleaned.match(/(\d{1,2})\s+([a-záéíóúñ]+)\.?\s+(\d{4})/);
  if (m) {
    const day = parseInt(m[1], 10);
    const monthRaw = m[2].normalize('NFD').replace(/[̀-ͯ]/g, '');
    const month = MONTH_LOOKUP[monthRaw] ?? null;
    if (month && day >= 1 && day <= 31) {
      return `${m[3]}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  const urlM = fallbackUrl.match(/\/(\d{4})\/(\d{2})\//);
  if (urlM) return `${urlM[1]}-${urlM[2]}-01`;
  return new Date().toISOString().slice(0, 10);
};

// Sin acentos + lower para comparar contra RELEVANCE_KEYWORDS.
const fold = (s: string): string =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const isRelevant = (title: string, url: string): boolean => {
  const haystack = fold(`${title} ${url}`);
  return RELEVANCE_KEYWORDS.some((k) => haystack.includes(k));
};

export interface ScrapedItem {
  titulo: string;
  resumen: string;
  url: string;
  fecha: string;
  autor: string;
  imagen: string | null;
  fuente: string;
}

export const scrapeMongabayMexico = async (): Promise<ScrapedItem[]> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let html: string;
  try {
    const res = await fetch(LIST_URL, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
    });
    if (!res.ok) {
      throw new Error(`Mongabay HTTP ${res.status}`);
    }
    html = await res.text();
  } finally {
    clearTimeout(timer);
  }

  // Cada artículo del grid vive en `<div class="article--container ...">…</div>`.
  // Capturamos por bloque para no cruzar entre artículos.
  const blocks = html.match(/<div class="article--container[^>]*>[\s\S]*?(?=<div class="article--container|<\/div>\s*<\/div>\s*<\/div>)/g) || [];

  const items: ScrapedItem[] = [];
  const seen = new Set<string>();

  for (const block of blocks) {
    const urlMatch = block.match(/href="(https:\/\/es\.mongabay\.com\/\d{4}\/\d{2}\/[^"]+)"/);
    if (!urlMatch) continue;
    const url = normalizeUrl(urlMatch[1]);
    if (seen.has(url)) continue;
    seen.add(url);

    const titleMatch = block.match(/<h\d[^>]*>([^<]+(?:<[^>]+>[^<]*)*)<\/h\d>/);
    const title = titleMatch ? decodeEntities(stripTags(titleMatch[1])) : '';
    if (!title) continue;

    const imgMatch = block.match(/<img[^>]+src="([^"]+)"/);
    const imagen = imgMatch ? imgMatch[1] : null;

    const bylineMatch = block.match(/<span class="byline"[^>]*>([^<]+)<\/span>/);
    const autor = bylineMatch ? decodeEntities(bylineMatch[1].trim()) : SOURCE_LABEL;

    const dateMatch = block.match(/<span class="date"[^>]*>([^<]+)<\/span>/);
    const fecha = parseDate(dateMatch ? dateMatch[1] : '', url);

    items.push({
      titulo: title.slice(0, 250),
      resumen: title.slice(0, 600), // mongabay listing no expone excerpt; el resumen real se completará al aprobar
      url,
      fecha,
      autor: autor.slice(0, 140),
      imagen,
      fuente: SOURCE_LABEL,
    });
  }

  return items;
};

// Inserta los items nuevos como prospectos. Retorna conteos.
export const ingestMongabayProspectos = async (): Promise<{
  scraped: number;
  inserted: number;
  skippedDuplicates: number;
  skippedIrrelevant: number;
}> => {
  const items = await scrapeMongabayMexico();

  // Filtra por relevancia. Si nada matchea (raro), conserva el set completo
  // para que el admin no se quede sin nada que revisar.
  const relevant = items.filter((i) => isRelevant(i.titulo, i.url));
  const skippedIrrelevant = items.length - relevant.length;
  const candidates = relevant.length > 0 ? relevant : items;

  let inserted = 0;
  let skippedDuplicates = 0;

  for (const it of candidates) {
    const urlHash = sha256(it.url);
    const existing = await repo().findOne({ where: { urlHash } });
    if (existing) {
      skippedDuplicates++;
      continue;
    }
    await repo().save(
      repo().create({
        titulo: it.titulo,
        resumen: it.resumen,
        url: it.url,
        fuente: it.fuente,
        fecha: it.fecha,
        estado: 'pendiente',
        urlHash,
      }),
    );
    inserted++;
  }

  return {
    scraped: items.length,
    inserted,
    skippedDuplicates,
    skippedIrrelevant,
  };
};
