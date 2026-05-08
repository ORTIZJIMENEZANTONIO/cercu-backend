import { Request, Response } from 'express';
import * as svc from './comunidad.service';

/**
 * POST /:observatory/comunidad/aportes
 *
 * Endpoint publico (sin auth) que recibe aportes de la comunidad.
 * El payload validado por `comunidadAporteSchema` ya viene en req.body.
 */
export const submitAporte = async (req: Request, res: Response) => {
  const observatory = req.params.observatory;
  const result = await svc.submitAporteComunidad(observatory, req.body);

  // Honeypot match -> respondemos 200 sin guardar para no dar pistas al bot
  if ('spam' in result && result.spam) {
    return res.status(200).json({
      success: true,
      message: 'Aporte recibido. Gracias.',
    });
  }

  return res.status(201).json({
    success: true,
    message: 'Aporte recibido. El equipo lo revisara.',
    data: result,
  });
};
