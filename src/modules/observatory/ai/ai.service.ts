import { config } from '../../../config';

interface AnalyzeRequest {
  imageBase64: string;
  mimeType?: string;
  buildingName?: string;
  buildingType?: string;
  alcaldia?: string;
  superficie?: number;
}

export interface RoofAnalysisResult {
  techoPlano: boolean;
  materialEstimado: string;
  vegetacionExistente: boolean;
  porcentajeVegetacion: number;
  obstrucciones: string[];
  aptitudTechoVerde: number;
  tipoRecomendado: 'extensivo' | 'semi-intensivo' | 'intensivo' | 'no_apto';
  areaUtilEstimadaPct: number;
  prediccion: string;
  confianza: 'alta' | 'media' | 'baja';
  porcentajeConfianza: number;
  observaciones: string[];
}

const SYSTEM_PROMPT = `Eres un sistema experto en evaluación de techos para instalación de techos verdes (TVLE — Techo Verde Ligero Extensivo) en la Ciudad de México. Analizas imágenes aéreas/satelitales o fotografías de azoteas.

Contexto técnico:
- Un TVLE pesa ~100 kg/m² (carga mínima según NTC-CDMX 2017)
- Requiere techo plano o pendiente <15°
- Materiales óptimos: losa de concreto, losacero, vigueta y bovedilla
- Obstrucciones comunes: equipos HVAC, tinacos, antenas, ductos, paneles solares
- La vegetación existente en el techo es señal positiva

Tu análisis debe ser técnico pero accesible. Responde SIEMPRE en español.`;

function buildUserPrompt(ctx: Partial<AnalyzeRequest>): string {
  const parts: string[] = [
    'Analiza esta imagen de un techo/azotea y evalúa su aptitud para instalar un techo verde ligero extensivo (TVLE).',
  ];
  if (ctx.buildingName) parts.push(`Edificio: ${ctx.buildingName}`);
  if (ctx.buildingType) parts.push(`Tipo: ${ctx.buildingType}`);
  if (ctx.alcaldia) parts.push(`Alcaldía: ${ctx.alcaldia}`);
  if (ctx.superficie) parts.push(`Superficie reportada: ${ctx.superficie} m²`);
  parts.push(`
Responde EXCLUSIVAMENTE con un JSON válido (sin markdown, sin backticks) con esta estructura exacta:
{
  "techoPlano": boolean,
  "materialEstimado": "losa_concreto | losacero | vigueta_bovedilla | lamina_metalica | lamina_asbesto | madera_teja | desconocido",
  "vegetacionExistente": boolean,
  "porcentajeVegetacion": number (0-100),
  "obstrucciones": ["lista de obstrucciones visibles"],
  "aptitudTechoVerde": number (0-100, donde 100 = perfecto para TVLE),
  "tipoRecomendado": "extensivo | semi-intensivo | intensivo | no_apto",
  "areaUtilEstimadaPct": number (0-100),
  "prediccion": "Resumen en español de 1-2 oraciones",
  "confianza": "alta | media | baja",
  "porcentajeConfianza": number (0-100),
  "observaciones": ["lista de observaciones técnicas relevantes"]
}`);
  return parts.join('\n');
}

function parseAndValidate(raw: string): RoofAnalysisResult {
  const cleaned = raw.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim();
  const parsed = JSON.parse(cleaned);

  parsed.aptitudTechoVerde = Math.max(0, Math.min(100, Number(parsed.aptitudTechoVerde) || 0));
  parsed.porcentajeConfianza = Math.max(0, Math.min(100, Number(parsed.porcentajeConfianza) || 50));
  parsed.porcentajeVegetacion = Math.max(0, Math.min(100, Number(parsed.porcentajeVegetacion) || 0));
  parsed.areaUtilEstimadaPct = Math.max(0, Math.min(100, Number(parsed.areaUtilEstimadaPct) || 0));

  if (!Array.isArray(parsed.obstrucciones)) parsed.obstrucciones = [];
  if (!Array.isArray(parsed.observaciones)) parsed.observaciones = [];

  const validConfianza = ['alta', 'media', 'baja'];
  if (!validConfianza.includes(parsed.confianza)) {
    parsed.confianza = parsed.porcentajeConfianza >= 80 ? 'alta' : parsed.porcentajeConfianza >= 50 ? 'media' : 'baja';
  }

  const validTipo = ['extensivo', 'semi-intensivo', 'intensivo', 'no_apto'];
  if (!validTipo.includes(parsed.tipoRecomendado)) parsed.tipoRecomendado = 'extensivo';

  return parsed as RoofAnalysisResult;
}

export class AIService {
  async analyzeRoof(body: AnalyzeRequest): Promise<{ ok: boolean; analysis?: RoofAnalysisResult; rawResponse?: string; error?: string }> {
    const apiKey = config.gemini.apiKey;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY no está configurada en el backend.');
    }

    if (!body.imageBase64) {
      throw new Error('Se requiere imageBase64 con la imagen codificada en base64.');
    }

    // Dynamic import to avoid issues if package not installed
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_PROMPT,
    });

    const mimeType = body.mimeType || 'image/jpeg';

    const result = await model.generateContent([
      { inlineData: { mimeType, data: body.imageBase64 } },
      buildUserPrompt(body),
    ]);

    const text = result.response.text();

    try {
      const analysis = parseAndValidate(text);
      return { ok: true, analysis };
    } catch {
      return { ok: false, rawResponse: text, error: 'No se pudo parsear la respuesta de Gemini como JSON.' };
    }
  }
}
