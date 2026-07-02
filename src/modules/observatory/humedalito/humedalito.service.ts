import { AppDataSource } from '../../../ormconfig';
import { ObsHumedal } from '../../../entities/observatory/Humedal';
import { ObsNotihumedal } from '../../../entities/observatory/Notihumedal';
import { config } from '../../../config';
import {
  SYSTEM_PROMPT,
  buildContext,
  FALLBACK_CONTEXT,
  isOnTopic,
  findFaqAnswer,
  matchArticles,
  SUGGESTED_QUESTIONS,
  OFF_TOPIC_MESSAGE,
  LIMITED_MODE_MESSAGE,
  ArticuloLite,
} from './humedalito.knowledge';

export interface ChatTurn {
  role: 'user' | 'bot';
  text: string;
}

export interface ChatResult {
  reply: string;
  sources?: string[];
  articles?: { slug: string; titulo: string }[];
  suggestions?: string[];
  offTopic?: boolean;
  limited?: boolean;
  source?: 'faq' | 'llm';
}

// Grounding cacheado (la BD cambia poco). TTL evita golpear la BD por request.
const TTL_MS = 10 * 60 * 1000;
let cache: { context: string; articulos: ArticuloLite[]; at: number } | null = null;

async function loadKnowledge(): Promise<{ context: string; articulos: ArticuloLite[] }> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache;
  try {
    const humedales = await AppDataSource.getRepository(ObsHumedal).find({
      where: { visible: true, archivado: false },
      order: { anioImplementacion: 'ASC' },
    });
    const notis = await AppDataSource.getRepository(ObsNotihumedal).find({
      where: { visible: true, archivado: false },
    });
    const articulos: ArticuloLite[] = notis.map((a) => ({
      slug: a.slug,
      titulo: a.titulo,
      resumen: a.resumen,
      tags: a.tags,
    }));
    const context = buildContext(humedales, articulos);
    cache = { context, articulos, at: Date.now() };
    return cache;
  } catch {
    // La BD no respondió: contexto mínimo, sin cachear (para reintentar luego).
    return { context: FALLBACK_CONTEXT, articulos: [] };
  }
}

export class HumedalitoService {
  async chat(message: string, history: ChatTurn[] = []): Promise<ChatResult> {
    const text = (message || '').toString().trim();

    // 2. Gate de tema — fuera de dominio no gasta llamada al LLM.
    if (!isOnTopic(text)) {
      return { reply: OFF_TOPIC_MESSAGE, offTopic: true, suggestions: SUGGESTED_QUESTIONS };
    }

    const kb = await loadKnowledge();
    const articles = matchArticles(kb.articulos, text);

    // 3. FAQ — respuestas frecuentes a costo 0.
    const faq = findFaqAnswer(text);
    if (faq) {
      return { reply: faq.reply, sources: faq.sources, articles, source: 'faq' };
    }

    // 5a. Sin API key → modo limitado (útil, sin costo).
    const apiKey = config.gemini.apiKey;
    if (!apiKey) {
      return { reply: LIMITED_MODE_MESSAGE, articles, suggestions: SUGGESTED_QUESTIONS, limited: true };
    }

    // 4. LLM (Gemini) grounded en los datos de la BD.
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
        systemInstruction: `${SYSTEM_PROMPT}\n\n${kb.context}`,
      });

      // Historial saneado: mapea roles y garantiza que empiece con 'user'.
      const mapped = (Array.isArray(history) ? history : [])
        .slice(-6)
        .filter((m) => m && m.text)
        .map((m) => ({
          role: m.role === 'bot' ? 'model' : 'user',
          parts: [{ text: String(m.text).slice(0, 1000) }],
        }));
      while (mapped.length && mapped[0].role !== 'user') mapped.shift();

      const contents = [...mapped, { role: 'user', parts: [{ text }] }];

      const result = await model.generateContent({
        contents,
        generationConfig: { temperature: 0.4, topP: 0.9, maxOutputTokens: 500 },
      });

      const reply = (result.response.text() || '').trim();
      if (!reply) {
        return { reply: LIMITED_MODE_MESSAGE, articles, suggestions: SUGGESTED_QUESTIONS, limited: true };
      }
      return { reply, articles, source: 'llm' };
    } catch (err: any) {
      // 5b. Falla del LLM (p. ej. 429 cuota) → degradar con gracia.
      console.error('[humedalito] error LLM:', err?.message || err);
      return {
        reply:
          'Tuve un problema para responder ahora mismo 😔. Mientras tanto, puedes ' +
          'explorar el inventario o los artículos del observatorio.',
        articles,
        suggestions: SUGGESTED_QUESTIONS,
        limited: true,
      };
    }
  }
}
