import { Request, Response } from 'express';
import { HumedalitoService, ChatTurn } from './humedalito.service';
import { SUGGESTED_QUESTIONS } from './humedalito.knowledge';
import { AppError } from '../../../middleware/errorHandler.middleware';

const service = new HumedalitoService();

// Rate limit en memoria (best-effort). Para multi-instancia usar Redis.
const RATE = { windowMs: 10 * 60 * 1000, max: 25 };
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now > rec.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE.windowMs });
    return false;
  }
  rec.count++;
  return rec.count > RATE.max;
}

export class HumedalitoController {
  async chat(req: Request, res: Response) {
    const message = (req.body?.message || '').toString().trim();
    const history = (req.body?.history || []) as ChatTurn[];

    if (!message) throw new AppError('Mensaje vacío', 400);
    if (message.length > 1000) throw new AppError('Mensaje demasiado largo', 413);

    const ip = (req.ip || req.socket?.remoteAddress || 'unknown') as string;
    if (rateLimited(ip)) {
      return res.status(429).json({
        reply:
          'Has enviado muchas preguntas en poco tiempo 🌿. Espera unos minutos e ' +
          'intenta de nuevo, por favor.',
        rateLimited: true,
        suggestions: SUGGESTED_QUESTIONS,
      });
    }

    const result = await service.chat(message, history);
    res.json(result);
  }
}
