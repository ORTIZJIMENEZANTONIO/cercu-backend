// Scraper de noticias del observatorio de arrecifes con pipeline multi-fuente.
//
// Prioridad (orden de ingestión, define cuál se inserta primero cuando hay
// colisión de urlHash entre fuentes — primero gana):
//   1. Mongabay México   — https://es.mongabay.com/list/mexico/  (feed grid)
//   2. The Nature Conservancy — página específica (single-article, dominio público
//      con atribución)
//   3. (futuras fuentes se concatenan al final con menor prioridad)
//
// Filosofía: el scraper sólo *propone*. Nada se publica automáticamente —
// cada prospecto entra a `obs_reef_news_prospects` con `status='pending'` y
// un administrador valida en `/admin/news` (tab Prospectos). El crédito al
// autor original se preserva en `source` + `url` y se inyecta al cuerpo del
// artículo cuando el admin aprueba.
import crypto from 'crypto';
import { AppDataSource } from '../../../ormconfig';
import { ObsReefNewsProspect } from '../../../entities/observatory/ReefNewsProspect';

// ── Configuración común ──
const FETCH_TIMEOUT_MS = 20000;
const USER_AGENT =
  'Mozilla/5.0 (compatible; ObservatorioArrecifesBot/1.0; +https://arrecifes.cercu.com.mx)';

// Keywords ajustadas a corales / arrecifes / geografía marina mexicana.
// Usadas para filtrar resultados de fuentes que entregan muchos artículos
// (ej. Mongabay). Las fuentes single-page no se filtran — confiamos en que
// el admin las eligió manualmente al añadirlas al pipeline.
const RELEVANCE_KEYWORDS = [
  'arrecife', 'arrecifes', 'coral', 'corales', 'coralino', 'coralina',
  'blanqueamiento', 'sctld', 'mortalidad coral',
  'mar', 'oceano', 'oceanos', 'marino', 'marina', 'marinos', 'marinas',
  'costa', 'costera', 'costero', 'litoral', 'litorales',
  'manglar', 'manglares', 'mangle', 'estuario', 'estuarios',
  'sargazo', 'sargasum', 'derrame', 'oleo', 'pesca', 'pesquero', 'pesquera',
  'sobrepesca', 'sobreexplotacion', 'aquaculture', 'acuicultura',
  'tortuga marina', 'tortugas marinas', 'tiburon', 'tiburones',
  'manta', 'mantas', 'vaquita', 'totoaba', 'mero', 'pargo', 'huachinango',
  'caracol rosado',
  'cabo pulmo', 'revillagigedo', 'sian kaan', 'banco chinchorro',
  'cozumel', 'puerto morelos', 'arrecifal veracruzano', 'alacranes',
  'islas marias', 'isla isabel', 'isla contoy', 'huatulco',
  'espiritu santo', 'xcalak', 'cayos arcas', 'parque nacional marino',
  'noaa', 'crw', 'dhw', 'sst', 'temperatura del mar',
  'ostra', 'ostras', 'molusco', 'moluscos',
];

const repo = () => AppDataSource.getRepository(ObsReefNewsProspect);

// ── Utilidades de parseo ──
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

const fold = (s: string): string =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const isReefRelevant = (title: string, url: string): boolean => {
  const haystack = fold(`${title} ${url}`);
  return RELEVANCE_KEYWORDS.some((k) => haystack.includes(k));
};

const MONTH_LOOKUP: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10,
  noviembre: 11, diciembre: 12,
  ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6,
  jul: 7, ago: 8, sep: 9, sept: 9, oct: 10, nov: 11, dic: 12,
  jan: 1, apr: 4, aug: 8, dec: 12,
};

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

const fetchHtml = async (url: string): Promise<string> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
};

// Extrae el contenido de un meta tag por property o name.
const extractMeta = (html: string, ...keys: string[]): string | null => {
  for (const key of keys) {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`,
      'i',
    );
    const m = html.match(re);
    if (m) return decodeEntities(m[1].trim());
    // Try reversed attribute order
    const re2 = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`,
      'i',
    );
    const m2 = html.match(re2);
    if (m2) return decodeEntities(m2[1].trim());
  }
  return null;
};

// ── Ítem normalizado que cualquier scraper devuelve ──
interface ScrapedItem {
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  author: string;
  image: string | null;
  source: string;
  // Si la fuente filtra por relevancia (ej. Mongabay), respeta el filtro.
  // Si la fuente es single-page seleccionada manualmente (ej. TNC), bypasa
  // el filtro: el admin ya decidió incluirla.
  bypassRelevanceFilter?: boolean;
}

// ────────────────────────── Fuente 1: Mongabay México ──────────────────────────
const MONGABAY_URL = 'https://es.mongabay.com/list/mexico/';
const MONGABAY_LABEL = 'Mongabay Latam';

const scrapeMongabayMexico = async (): Promise<ScrapedItem[]> => {
  let html: string;
  try {
    html = await fetchHtml(MONGABAY_URL);
  } catch (e) {
    console.warn('[reefNews-scraper] Mongabay fetch failed:', (e as Error).message);
    return [];
  }
  const blocks =
    html.match(/<div class="article--container[^>]*>[\s\S]*?(?=<div class="article--container|<\/div>\s*<\/div>\s*<\/div>)/g) || [];
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
    const image = imgMatch ? imgMatch[1] : null;

    const bylineMatch = block.match(/<span class="byline"[^>]*>([^<]+)<\/span>/);
    const author = bylineMatch ? decodeEntities(bylineMatch[1].trim()) : MONGABAY_LABEL;

    const dateMatch = block.match(/<span class="date"[^>]*>([^<]+)<\/span>/);
    const publishedAt = parseDate(dateMatch ? dateMatch[1] : '', url);

    items.push({
      title: title.slice(0, 250),
      summary: title.slice(0, 600),
      url,
      publishedAt,
      author: author.slice(0, 140),
      image,
      source: MONGABAY_LABEL,
    });
  }

  return items;
};

// ────────────────────────── Fuente 2: The Nature Conservancy ──────────────────────────
// La página de TNC "Buenas noticias del ambiente" es un artículo curado
// (no un feed). Extraemos sus metadatos vía Open Graph y la registramos como
// un prospecto único. Re-correr el scraper no añade duplicados (urlHash).
// Cuando TNC publique una nueva edición agregaremos su URL a TNC_URLS.
const TNC_LABEL = 'The Nature Conservancy';
const TNC_URLS = [
  'https://www.nature.org/es-us/que-hacemos/nuestras-prioridades/proteger-la-tierra-y-el-agua/buenas-noticias-del-ambiente/',
];

const scrapeTNCSinglePage = async (pageUrl: string): Promise<ScrapedItem | null> => {
  let html: string;
  try {
    html = await fetchHtml(pageUrl);
  } catch (e) {
    console.warn(`[reefNews-scraper] TNC fetch failed (${pageUrl}):`, (e as Error).message);
    return null;
  }

  const ogTitle = extractMeta(html, 'og:title');
  const titleTag = html.match(/<title>([^<]+)<\/title>/);
  const title = ogTitle || (titleTag ? decodeEntities(titleTag[1]).split(' | ')[0].trim() : '');
  if (!title) return null;

  const summary =
    extractMeta(html, 'og:description', 'description', 'twitter:description') ||
    title;

  const image = extractMeta(html, 'og:image', 'twitter:image');

  const publishedRaw =
    extractMeta(html, 'article:published_time', 'og:published_time') ||
    extractMeta(html, 'article:modified_time') ||
    '';
  const publishedAt =
    publishedRaw && /^\d{4}-\d{2}-\d{2}/.test(publishedRaw)
      ? publishedRaw.slice(0, 10)
      : new Date().toISOString().slice(0, 10);

  const author =
    extractMeta(html, 'author', 'article:author') || TNC_LABEL;

  return {
    title: title.slice(0, 250),
    summary: summary.slice(0, 600),
    url: normalizeUrl(pageUrl),
    publishedAt,
    author: author.slice(0, 140),
    image: image && image.startsWith('http') ? image : null,
    source: TNC_LABEL,
    bypassRelevanceFilter: true, // curada manualmente, no filtra por keywords
  };
};

const scrapeTNC = async (): Promise<ScrapedItem[]> => {
  const results = await Promise.all(TNC_URLS.map((u) => scrapeTNCSinglePage(u)));
  return results.filter((x): x is ScrapedItem => x !== null);
};

// ────────────────────────── Pipeline ──────────────────────────
// Orden de las fuentes = prioridad de inserción. Si dos fuentes devuelven el
// mismo urlHash (raro), gana la primera porque se procesa antes.
const SOURCES: Array<() => Promise<ScrapedItem[]>> = [
  scrapeMongabayMexico, // 1. primaria — feed con muchos artículos
  scrapeTNC,            // 2. secundaria — page única curada
  // 3. (futuras fuentes con menor prioridad se agregan aquí)
];

export const ingestReefNewsProspectos = async (): Promise<{
  scraped: number;
  inserted: number;
  skippedDuplicates: number;
  skippedIrrelevant: number;
  bySource: Record<string, { scraped: number; inserted: number }>;
}> => {
  // Recolecta de cada fuente (en serie para preservar prioridad de inserción
  // cuando varias intenten el mismo urlHash en la misma corrida).
  const bySource: Record<string, { scraped: number; inserted: number }> = {};
  let allItems: ScrapedItem[] = [];
  for (const fn of SOURCES) {
    const items = await fn();
    allItems = allItems.concat(items);
    for (const it of items) {
      if (!bySource[it.source]) bySource[it.source] = { scraped: 0, inserted: 0 };
      bySource[it.source].scraped++;
    }
  }

  // Filtra por relevancia, respetando bypass. Las fuentes single-page
  // (curadas manualmente) saltan el filtro.
  const candidates = allItems.filter(
    (i) => i.bypassRelevanceFilter || isReefRelevant(i.title, i.url),
  );
  const skippedIrrelevant = allItems.length - candidates.length;

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
        title: it.title,
        summary: it.summary,
        url: it.url,
        source: it.source,
        publishedAt: it.publishedAt,
        image: it.image,
        status: 'pending',
        urlHash,
      }),
    );
    inserted++;
    bySource[it.source].inserted++;
  }

  return {
    scraped: allItems.length,
    inserted,
    skippedDuplicates,
    skippedIrrelevant,
    bySource,
  };
};
