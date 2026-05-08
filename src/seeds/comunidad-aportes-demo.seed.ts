import { AppDataSource } from '../ormconfig';
import {
  ProspectSubmission,
  ProspectStatus,
  ProspectSource,
} from '../entities/observatory/ProspectSubmission';

/**
 * Seed de aportes demo de comunidad para techos-verdes.
 *
 * Inserta 4 ProspectSubmissions con `source = 'comunidad'` y `status = 'pendiente'`
 * para que la cola de revisión en /admin/prospectos no esté vacía en
 * desarrollo y demos.
 *
 * Idempotente: solo inserta si NO hay ya aportes con source='comunidad' para
 * techos-verdes. Esto evita duplicar aportes en re-runs y NO toca aportes
 * reales que pudieran haber llegado vía POST /:observatory/comunidad/aportes.
 */
export async function seedComunidadAportesDemo() {
  const repo = AppDataSource.getRepository(ProspectSubmission);

  const existing = await repo.count({
    where: {
      observatory: 'techos-verdes',
      source: ProspectSource.COMUNIDAD,
    },
  });

  if (existing > 0) {
    console.log(
      `  Comunidad demo: skip (ya existen ${existing} aportes con source='comunidad')`,
    );
    return;
  }

  const demos = [
    {
      observatory: 'techos-verdes',
      status: ProspectStatus.PENDIENTE,
      source: ProspectSource.COMUNIDAD,
      data: {
        tipo: 'aporte_comunidad',
        nombre: 'María Sánchez',
        email: 'maria.sanchez@example.org',
        alcaldia: 'Coyoacán',
        modo: 'aprendiz',
        rol: 'ciudadano',
        mensaje:
          'Hay una azotea con vegetación abundante en un edificio cerca del Mercado de Coyoacán. La he observado por meses y siempre se mantiene verde. Adjunto la dirección aproximada para que la registren.',
        direccion: 'Calle Ignacio Allende, Del Carmen',
        lat: 19.3497,
        lng: -99.1621,
      },
    },
    {
      observatory: 'techos-verdes',
      status: ProspectStatus.PENDIENTE,
      source: ProspectSource.COMUNIDAD,
      data: {
        tipo: 'aporte_comunidad',
        nombre: 'Arq. Carlos Mendoza',
        email: 'carlos.mendoza@arq-estudio.mx',
        alcaldia: 'Cuauhtémoc',
        modo: 'caracterizador',
        rol: 'arquitecto',
        mensaje:
          'Aporto datos técnicos del techo verde extensivo en Reforma 222: superficie 1,200 m², sustrato 12 cm, mezcla de Sedum y crasuláceas, instalado en 2022. Tengo plantas y memoria de cálculo si las necesitan.',
        direccion: 'Paseo de la Reforma 222',
        lat: 19.427,
        lng: -99.1677,
      },
    },
    {
      observatory: 'techos-verdes',
      status: ProspectStatus.PENDIENTE,
      source: ProspectSource.COMUNIDAD,
      data: {
        tipo: 'aporte_comunidad',
        nombre: 'Equipo Sustentabilidad UAM-A',
        email: 'sustentabilidad@azc.uam.mx',
        alcaldia: 'Azcapotzalco',
        modo: 'especialista',
        rol: 'academia',
        mensaje:
          'Estamos interesados en publicar un caso de estudio del techo verde de la UAM-Azcapotzalco. Tenemos series de monitoreo de temperatura (2021-2024) y captación de agua. ¿Cómo podemos integrar estos datos al observatorio?',
      },
    },
    {
      observatory: 'techos-verdes',
      status: ProspectStatus.PENDIENTE,
      source: ProspectSource.COMUNIDAD,
      data: {
        tipo: 'aporte_comunidad',
        nombre: 'Verdex Construcciones SA de CV',
        email: 'contacto@verdex.example',
        alcaldia: 'Miguel Hidalgo',
        modo: 'operador',
        rol: 'empresa',
        mensaje:
          'Operamos 5 techos verdes intensivos en edificios corporativos de Polanco. Ofrecemos compartir bitácoras de mantenimiento y mediciones de carga estructural posinstalación para alimentar el modelo de pre-factibilidad.',
      },
    },
  ];

  await repo.save(repo.create(demos));
  console.log(`  Comunidad demo: ${demos.length} aportes pendientes creados`);
}
