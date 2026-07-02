// ────────────────────────────────────────────────────────────────────────────
// Base de conocimiento y guardrails del chatbot Humedalito (divulgación).
// Lógica pura (sin DB ni red). El contexto se arma desde datos que se le pasan
// (grounding), para poder alimentarlo con las filas reales de la BD.
// ────────────────────────────────────────────────────────────────────────────

export const SUGGESTED_QUESTIONS: string[] = [
  '¿Qué es un humedal artificial?',
  '¿Flujo superficial o subsuperficial?',
  '¿Qué contaminantes remueven?',
  '¿Son más baratos que una planta?',
  '¿Cuántos hay en la CDMX?',
  'Recomiéndame un artículo',
];

export const OFF_TOPIC_MESSAGE =
  'Soy Humedalito 🌿, un asistente de divulgación enfocado únicamente en ' +
  'humedales construidos (artificiales) para el tratamiento de agua. Puedo ' +
  'ayudarte con sus tipos, plantas, sustratos, eficiencias, o dónde están en ' +
  'la CDMX. ¿Te muestro algo de eso?';

export const LIMITED_MODE_MESSAGE =
  'Puedo responder algunas preguntas frecuentes sobre humedales construidos y ' +
  'sugerirte artículos del observatorio. Prueba una de las preguntas sugeridas 👇';

const DOMAIN_KEYWORDS = [
  'humedal', 'wetland', 'agua', 'residual', 'tratamiento', 'depura', 'saneamiento',
  'flujo', 'superficial', 'subsuperficial', 'fws', 'sfs', 'hssf', 'vssf', 'vertical',
  'horizontal', 'hibrido', 'híbrido', 'sustrato', 'tezontle', 'grava', 'arena',
  'vegetaci', 'planta', 'carrizo', 'papiro', 'tule', 'typha', 'phragmites', 'macrofita',
  'macrófita', 'dqo', 'dbo', 'sst', 'coliforme', 'nitrogeno', 'nitrógeno', 'fosforo',
  'fósforo', 'amonio', 'nutriente', 'contaminante', 'remoci', 'remueve', 'eficiencia',
  'ajolote', 'ave', 'biodiversidad', 'carbono', 'ecosistem', 'servicio', 'alcaldia',
  'alcaldía', 'cdmx', 'ciudad de méxico', 'ciudad de mexico', 'aragon', 'aragón',
  'cuitlahuac', 'cuitláhuac', 'cuemanco', 'xochimilco', 'shatto', 'encit', 'ciiemad',
  'anfibium', 'playa de aves', 'cerro de la estrella', 'vivero', 'tlaxialtemalco',
  'reuso', 'reúso', 'riego', 'infiltra', 'recarga', 'calidad del agua', 'artificial',
  'construido', 'natural', 'ramsar', 'ipn', 'unam', 'uam', 'inventario', 'mapa',
  'costo', 'cuesta', 'precio', 'barato', 'economico', 'económico', 'mantenimiento',
  'casa', 'hogar', 'domestic', 'doméstic', 'construir', 'diseñ', 'disen', 'beneficio',
  'ventaja', 'clima', 'co2', 'fauna', 'donde', 'dónde', 'cuantos', 'cuántos', 'ubicaci',
];

const GREETING_KEYWORDS = [
  'hola', 'buenas', 'buenos dias', 'buenos días', 'buenas tardes', 'hey', 'holi',
  'gracias', 'quien eres', 'quién eres', 'que eres', 'qué eres', 'que puedes',
  'qué puedes', 'ayuda', 'humedalito', 'sugier', 'articulo', 'artículo', 'recomienda',
  'recomiéndame', 'recomiendame', 'ejemplo', 'divulga',
];

function normalize(text: string): string {
  return (text || '').toLowerCase().trim();
}

export function isOnTopic(text: string): boolean {
  const t = normalize(text);
  if (!t) return false;
  if (GREETING_KEYWORDS.some((k) => t.includes(k))) return true;
  return DOMAIN_KEYWORDS.some((k) => t.includes(k));
}

interface FaqEntry {
  match: string[];
  reply: string;
  sources?: string[];
}

const FAQ: FaqEntry[] = [
  {
    match: ['que es un humedal', 'qué es un humedal', 'que son los humedales', 'definicion', 'definición'],
    reply:
      'Un humedal artificial (o construido) es un sistema de tratamiento de agua ' +
      'diseñado para imitar los procesos de depuración de los humedales naturales. ' +
      'Combina vegetación acuática, un sustrato (grava, arena, tezontle) y ' +
      'microorganismos que, juntos, remueven contaminantes del agua residual. Es ' +
      'una solución basada en la naturaleza: de bajo costo, bajo consumo energético ' +
      'y con beneficios ecológicos añadidos (hábitat, captura de carbono).',
    sources: ['Domínguez-Solís et al. (2025), Water 17(10):1451'],
  },
  {
    match: ['diferencia', 'flujo superficial', 'flujo subsuperficial', 'fws', 'sfs', 'tipos de humedal', 'tipologia', 'tipología'],
    reply:
      'Hay tres tipologías principales según cómo fluye el agua:\n' +
      '• Flujo superficial (FWS): el agua corre visible sobre el sustrato, como un ' +
      'humedal natural. Bueno para hábitat y pulido final.\n' +
      '• Flujo subsuperficial (SFS): el agua pasa a través del sustrato sin quedar ' +
      'expuesta (horizontal HSSF o vertical VSSF). Mayor eficiencia de remoción y ' +
      'sin malos olores ni mosquitos.\n' +
      '• Híbrido: combina módulos FWS y SFS en serie para maximizar la depuración.',
    sources: ['Vymazal (2010); Domínguez-Solís et al. (2025)'],
  },
  {
    match: ['eficiencia', 'remocion', 'remoción', 'contaminante', 'dqo', 'dbo', 'coliforme', 'nitrogeno', 'fosforo', 'fósforo'],
    reply:
      'Las eficiencias documentadas en humedales de la CDMX y México son altas:\n' +
      '• DQO: 80–95.7% (Aragón STHA; Romero-Aguilar et al.)\n' +
      '• DBO₅: hasta 92% (CIIEMAD-IPN)\n' +
      '• Nitrógeno amoniacal: 85–90%\n' +
      '• Fósforo/fosfatos: ~50–89%\n' +
      '• Coliformes fecales: >90% (hasta 100% en Texcoco)\n' +
      'Los valores varían según el diseño, la temporada y el tipo de flujo.',
    sources: [
      'Ramírez-Carrillo et al. (2009), Rev. Mex. Ing. Quím. 8(1)',
      'Luna-Pabello & Aburto-Castañeda (2014), TIP Rev. 17(1)',
      'Domínguez Solís (2025), CIIEMAD-IPN',
    ],
  },
  {
    match: ['plantas', 'vegetacion', 'vegetación', 'sustrato', 'que plantas', 'qué plantas'],
    reply:
      'Vegetación típica: carrizo (Phragmites), tule/espadaña (Typha), papiro, ' +
      'cola de caballo y otras macrófitas emergentes; también flotantes (lenteja ' +
      'de agua) y sumergidas. El sustrato suele ser grava, arena o tezontle, que ' +
      'sostiene la biopelícula de microorganismos donde ocurre buena parte de la ' +
      'depuración.',
  },
  {
    match: ['servicio', 'beneficio', 'para que sirve', 'para qué sirve', 'ventaja'],
    reply:
      'Además de limpiar el agua, un humedal artificial ofrece varios servicios ' +
      'ecosistémicos:\n' +
      '• Hábitat para fauna (aves, anfibios, insectos)\n' +
      '• Captura de carbono\n' +
      '• Regulación térmica (mitiga islas de calor)\n' +
      '• Control de inundaciones y recarga de acuíferos\n' +
      '• Educación ambiental y espacios verdes\n' +
      'Por eso se les llama "soluciones basadas en la naturaleza".',
  },
  {
    match: ['cuantos', 'cuántos', 'donde estan', 'dónde están', 'donde hay', 'inventario', 'que alcaldia', 'qué alcaldía', 'ubicaci'],
    reply:
      'El observatorio documenta 14 humedales artificiales públicos en 7 alcaldías ' +
      'de la CDMX. Algunos ejemplos: el sistema STHA del Bosque de Aragón (GAM), el ' +
      'Parque Ecológico Cuitláhuac (Iztapalapa), CIBAC Cuemanco y el Vivero ' +
      'Tlaxialtemalco (Xochimilco), SHATTO y ENCiT (UNAM, Coyoacán). Puedes verlos ' +
      'todos en el mapa e inventario del sitio.',
  },
  {
    match: ['costo', 'cuesta', 'precio', 'barato', 'economico', 'económico', 'caro'],
    reply:
      'Tratar agua con un humedal artificial cuesta aproximadamente $0.50–2 por m³, ' +
      'frente a $5–15 por m³ de una planta convencional. Son más baratos de operar ' +
      'porque usan poca o nula energía y aprovechan procesos naturales; a cambio ' +
      'requieren más superficie. (Comparativo en la sección de Hallazgos.)',
  },
  {
    match: ['carbono', 'clima', 'co2', 'calentamiento'],
    reply:
      'Sí. La vegetación y los sedimentos de los humedales capturan carbono; según ' +
      'la CONABIO, los humedales pueden capturar hasta 10 veces más CO₂ que las ' +
      'selvas tropicales, además de ayudar a regular la temperatura urbana.',
    sources: ['CONABIO — SIMOH-Mx'],
  },
  {
    match: ['ajolote', 'ave', 'aves', 'fauna', 'biodiversidad', 'animales'],
    reply:
      'Sí, funcionan como refugio de fauna. En los humedales de la CDMX se han ' +
      'registrado hasta 397 especies de aves; la Playa de Aves del Bosque de Aragón ' +
      'alberga decenas de aves acuáticas. También favorecen anfibios y fauna nativa.',
    sources: ['Gobierno CDMX (2021); CONABIO'],
  },
  {
    match: ['casa', 'hogar', 'domestic', 'doméstic', 'construir uno', 'hacer uno', 'mi patio'],
    reply:
      'Sí, existen humedales a escala doméstica para tratar el agua de una vivienda. ' +
      'En la CDMX hay investigación aplicada al respecto (Domínguez Solís, CIIEMAD-IPN, ' +
      '2025, en la colonia La Laguna Ticomán). Requieren diseño técnico: superficie, ' +
      'sustrato y plantas adecuadas; conviene apoyarse en especialistas.',
    sources: ['Domínguez Solís (2025), CIIEMAD-IPN'],
  },
  {
    match: ['diferencia con', 'vs natural', 'construido o natural', 'humedal natural'],
    reply:
      'Un humedal natural se forma solo (pantanos, ciénegas, lagunas). Un humedal ' +
      'artificial o construido lo diseñamos y edificamos para tratar agua residual, ' +
      'controlando el flujo, el sustrato y las plantas para maximizar la depuración. ' +
      'El artificial imita al natural, pero con fines de saneamiento.',
  },
];

export function findFaqAnswer(text: string): { reply: string; sources?: string[] } | null {
  const t = normalize(text);
  if (!t) return null;
  for (const entry of FAQ) {
    if (entry.match.some((m) => t.includes(m))) {
      return { reply: entry.reply, sources: entry.sources };
    }
  }
  return null;
}

export interface ArticuloLite {
  slug: string;
  titulo: string;
  resumen?: string | null;
  tags?: string[] | null;
}

export function matchArticles(
  articulos: ArticuloLite[],
  text: string,
  limit = 2,
): { slug: string; titulo: string }[] {
  const t = normalize(text);
  if (!t) return [];
  const words = t.split(/\s+/).filter((w) => w.length > 3);
  const scored = articulos
    .map((a) => {
      const hay = `${a.titulo} ${a.resumen || ''} ${(a.tags || []).join(' ')}`.toLowerCase();
      const score = words.reduce((s, w) => (hay.includes(w) ? s + 1 : s), 0);
      return { slug: a.slug, titulo: a.titulo, score };
    })
    .filter((a) => a.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(({ slug, titulo }) => ({ slug, titulo }));
}

const TIPO_LABEL: Record<string, string> = {
  ha_fws: 'flujo superficial (FWS)',
  ha_sfs_horizontal: 'flujo subsuperficial horizontal (HSSF)',
  ha_sfs_vertical: 'flujo subsuperficial vertical (VSSF)',
  ha_hibrido: 'híbrido (FWS + SFS)',
};

export interface HumedalLite {
  nombre: string;
  alcaldia: string;
  tipoHumedal: string;
  anioImplementacion: string;
  superficie?: number | null;
  funcionPrincipal?: string | null;
}

/** Arma el bloque de conocimiento (context-stuffing) desde datos de la BD. */
export function buildContext(humedales: HumedalLite[], articulos: ArticuloLite[]): string {
  const inventario = humedales
    .map((h) => {
      const tipo = TIPO_LABEL[h.tipoHumedal] || h.tipoHumedal;
      const sup = h.superficie ? `${Number(h.superficie).toLocaleString('es-MX')} m²` : 's/d';
      return `- ${h.nombre} (${h.alcaldia}, ${h.anioImplementacion}): ${tipo}; superficie ${sup}; ${h.funcionPrincipal || ''}`;
    })
    .join('\n');

  const articulosLista = articulos
    .map((a) => `- "${a.titulo}" [slug: ${a.slug}] — ${a.resumen || ''}`)
    .join('\n');

  return `CONTEXTO DEL OBSERVATORIO (usa SOLO esta información; si algo no está aquí, dilo):

QUÉ SON: Los humedales artificiales/construidos son sistemas de tratamiento de agua residual basados en la naturaleza. Usan vegetación, sustrato y microorganismos para remover contaminantes. Se clasifican por el tipo de flujo: superficial (FWS), subsuperficial horizontal (HSSF) o vertical (VSSF), e híbrido.

EFICIENCIAS DOCUMENTADAS (CDMX/México): DQO 80–95.7%; DBO₅ hasta 92%; nitrógeno amoniacal 85–90%; fósforo ~50–89%; coliformes fecales >90% (hasta 100% en Texcoco). Varían por diseño, temporada y tipo de flujo.

INVENTARIO (humedales públicos en la CDMX):
${inventario || '- (sin datos disponibles)'}

ARTÍCULOS DEL OBSERVATORIO (recomiéndalos por su slug con el enlace /notihumedal/{slug}):
${articulosLista || '- (sin artículos disponibles)'}

FUENTES PRINCIPALES: Domínguez Solís (CIIEMAD-IPN, 2024–2025); Luna-Pabello & Aburto-Castañeda (2014, UNAM); Ramírez-Carrillo et al. (2009); CONAGUA; CONABIO.`;
}

/** Contexto mínimo de respaldo si la BD no responde. */
export const FALLBACK_CONTEXT = buildContext([], []);

export const SYSTEM_PROMPT = `Eres "Humedalito", la mascota y asistente de divulgación científica del Observatorio de Humedales Artificiales de la Ciudad de México.

TU ÁMBITO (estricto): respondes ÚNICAMENTE sobre humedales construidos/artificiales para tratamiento de agua: qué son, tipos, plantas, sustratos, microorganismos, eficiencias de remoción, servicios ecosistémicos, el inventario de la CDMX y temas directamente relacionados. Si te preguntan algo fuera de esto (programación, política, chismes, tareas escolares no relacionadas, etc.), NO lo respondas: redirige con amabilidad hacia los humedales.

REGLAS:
1. Usa SOLO la información del contexto proporcionado. Si no está ahí, di honestamente que no tienes ese dato; NO inventes cifras, nombres ni fuentes.
2. Cita la fuente cuando des datos técnicos (eficiencias, capacidades, años).
3. Tono: cálido, claro y accesible (divulgación para público general), pero riguroso. Usa un emoji ocasional 🌿💧, sin exagerar.
4. Respuestas BREVES y bien estructuradas (pensadas para leerse en un celular): 2–5 frases o viñetas cortas. Evita párrafos largos.
5. Cuando sea útil, sugiere un artículo del observatorio por su slug.
6. Español de México (es-MX). No des consejos médicos, legales ni de ingeniería de detalle; remite a las fuentes.`;
