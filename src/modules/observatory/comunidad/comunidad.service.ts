import { AppDataSource } from '../../../ormconfig';
import { ProspectSubmission, ProspectStatus, ProspectSource } from '../../../entities/observatory/ProspectSubmission';
import { AppError } from '../../../middleware/errorHandler.middleware';

const prospectRepo = () => AppDataSource.getRepository(ProspectSubmission);

const ALLOWED_OBSERVATORIES = new Set(['techos-verdes', 'humedales', 'arrecifes']);

export interface ComunidadAportePayload {
  nombre: string;
  email: string;
  alcaldia?: string;
  modo?: string;
  rol?: string;
  mensaje: string;
  lat?: number;
  lng?: number;
  direccion?: string;
  imagen?: string | null;
  website?: string; // honeypot
}

/**
 * Crea un ProspectSubmission a partir de un aporte de comunidad.
 *
 * El aporte se guarda con source=COMUNIDAD y status=PENDIENTE para revision
 * manual desde /admin/prospectos.
 */
export async function submitAporteComunidad(
  observatory: string,
  payload: ComunidadAportePayload,
) {
  if (!ALLOWED_OBSERVATORIES.has(observatory)) {
    throw new AppError(`Observatorio no soportado: ${observatory}`, 400);
  }

  // Honeypot: si el bot llena `website` rechazamos silenciosamente con 200
  if (payload.website && payload.website.trim().length > 0) {
    return { spam: true } as const;
  }

  const data: Record<string, unknown> = {
    tipo: 'aporte_comunidad',
    nombre: payload.nombre.trim(),
    email: payload.email.trim().toLowerCase(),
    mensaje: payload.mensaje.trim(),
  };
  if (payload.alcaldia) data.alcaldia = payload.alcaldia.trim();
  if (payload.modo) data.modo = payload.modo;
  if (payload.rol) data.rol = payload.rol;
  if (typeof payload.lat === 'number') data.lat = payload.lat;
  if (typeof payload.lng === 'number') data.lng = payload.lng;
  if (payload.direccion) data.direccion = payload.direccion.trim();
  if (payload.imagen) data.imagen = payload.imagen;

  const created = await prospectRepo().save(
    prospectRepo().create({
      observatory,
      status: ProspectStatus.PENDIENTE,
      source: ProspectSource.COMUNIDAD,
      data,
    }),
  );

  return { id: created.id, status: created.status };
}
