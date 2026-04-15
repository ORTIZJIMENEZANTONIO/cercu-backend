import { AppDataSource } from '../ormconfig';
import { ObsGreenRoof } from '../entities/observatory/GreenRoof';
import { ObsCandidateRoof } from '../entities/observatory/CandidateRoof';
import { ObsValidationRecord } from '../entities/observatory/ValidationRecord';
import { ObsHumedal } from '../entities/observatory/Humedal';
import { ObsHallazgo } from '../entities/observatory/Hallazgo';
import { ObsNotihumedal } from '../entities/observatory/Notihumedal';
import { ObsProspectoNoticia } from '../entities/observatory/ProspectoNoticia';
import { ObsCmsSection } from '../entities/observatory/CmsSection';
import { ProspectSubmission, ProspectStatus, ProspectSource } from '../entities/observatory/ProspectSubmission';
import * as crypto from 'crypto';

export async function seedObservatoryContent() {
  // ── Green Roofs ──
  const greenRoofRepo = AppDataSource.getRepository(ObsGreenRoof);
  if ((await greenRoofRepo.count()) === 0) {
    await greenRoofRepo.save(greenRoofRepo.create([
      {
        nombre: 'Techo Verde UNAM - Facultad de Ciencias',
        alcaldia: 'Coyoacan',
        direccion: 'Ciudad Universitaria, Circuito Exterior s/n',
        tipoEdificio: 'educativo',
        tipoTechoVerde: 'extensivo',
        superficie: 450.0,
        estado: 'activo',
        lat: 19.3262,
        lng: -99.1764,
        imagen: null,
        descripcion: 'Techo verde extensivo instalado como proyecto piloto de la Facultad de Ciencias. Vegetacion de sedum y pastos nativos.',
        fechaRegistro: '2023-06-15',
      },
      {
        nombre: 'Azotea Verde Reforma 222',
        alcaldia: 'Cuauhtemoc',
        direccion: 'Paseo de la Reforma 222',
        tipoEdificio: 'comercial',
        tipoTechoVerde: 'semi-intensivo',
        superficie: 1200.0,
        estado: 'activo',
        lat: 19.4270,
        lng: -99.1677,
        imagen: null,
        descripcion: 'Azotea verde semi-intensiva en edificio corporativo con area de descanso y huerto urbano.',
        fechaRegistro: '2022-03-10',
      },
      {
        nombre: 'Techo Verde Mercado de Coyoacan',
        alcaldia: 'Coyoacan',
        direccion: 'Calle Ignacio Allende s/n, Del Carmen',
        tipoEdificio: 'comercial',
        tipoTechoVerde: 'extensivo',
        superficie: 320.0,
        estado: 'mantenimiento',
        lat: 19.3497,
        lng: -99.1621,
        imagen: null,
        descripcion: 'Techo verde extensivo en el mercado municipal. Requiere mantenimiento periodico de impermeabilizacion.',
        fechaRegistro: '2024-01-20',
      },
    ]));
    console.log('  ObsGreenRoof: 3 records created');
  }

  // ── Candidate Roofs ──
  const candidateRepo = AppDataSource.getRepository(ObsCandidateRoof);
  if ((await candidateRepo.count()) === 0) {
    await candidateRepo.save(candidateRepo.create([
      {
        nombre: 'Hospital General de Mexico',
        alcaldia: 'Cuauhtemoc',
        direccion: 'Dr. Balmis 148, Doctores',
        tipoEdificio: 'salud',
        superficie: 2800.0,
        scoreAptitud: 82.5,
        estatus: 'candidato',
        lat: 19.4117,
        lng: -99.1520,
        imagen: null,
        variables: { area: 0.9, rectangularidad: 0.85, niveles: 0.7, materialTecho: 0.9, pendiente: 0.95, obstrucciones: 0.6, accesibilidad: 0.8, cargaEstructural: 0.75 },
        confianzaIA: 'alta',
        fechaPriorizacion: '2025-01-15',
      },
      {
        nombre: 'Palacio de Bellas Artes - Anexo',
        alcaldia: 'Cuauhtemoc',
        direccion: 'Av. Juarez s/n, Centro Historico',
        tipoEdificio: 'cultural',
        superficie: 950.0,
        scoreAptitud: 45.0,
        estatus: 'factibilidad_pendiente',
        lat: 19.4352,
        lng: -99.1413,
        imagen: null,
        variables: { area: 0.7, rectangularidad: 0.4, niveles: 0.5, materialTecho: 0.6, pendiente: 0.3, obstrucciones: 0.4, accesibilidad: 0.3, cargaEstructural: 0.5 },
        confianzaIA: 'baja',
        fechaPriorizacion: '2025-02-01',
      },
    ]));
    console.log('  ObsCandidateRoof: 2 records created');
  }

  // ── Validation Records ──
  const validationRepo = AppDataSource.getRepository(ObsValidationRecord);
  if ((await validationRepo.count()) === 0) {
    await validationRepo.save(validationRepo.create([
      {
        candidatoId: 1,
        nombre: 'Hospital General de Mexico - Validacion Visual',
        imagen: null,
        prediccion: 'Techo plano de losa de concreto con pocas obstrucciones. Apto para TVLE.',
        confianza: 'alta',
        porcentajeConfianza: 88.5,
        estado: 'confirmado',
        revisadoPor: 'Admin Observatorios',
        fechaRevision: new Date('2025-02-10'),
      },
    ]));
    console.log('  ObsValidationRecord: 1 record created');
  }

  // ── Humedales ──
  const humedalRepo = AppDataSource.getRepository(ObsHumedal);
  if ((await humedalRepo.count()) === 0) {
    await humedalRepo.save(humedalRepo.create([
      {
        nombre: 'Humedal de Tratamiento San Luis Tlaxialtemalco',
        alcaldia: 'Xochimilco',
        ubicacion: 'Barrio San Luis Tlaxialtemalco, junto al canal de Cuemanco',
        tipoHumedal: 'tratamiento_aguas',
        funcionPrincipal: 'Tratamiento de aguas residuales mediante fitodepuracion con plantas nativas',
        superficie: 3500.0,
        volumen: 1200.0,
        capacidadTratamiento: '50,000 litros/dia',
        anioImplementacion: '2021',
        vegetacion: ['Typha latifolia', 'Schoenoplectus americanus', 'Lemna minor'],
        sustrato: 'Grava volcanica (tezontle) + arena',
        usoAgua: 'Riego de chinampas y areas verdes',
        serviciosEcosistemicos: ['tratamiento_agua', 'biodiversidad', 'regulacion_climatica', 'educacion'],
        serviciosDescripcion: [
          'Filtracion natural de contaminantes y nutrientes',
          'Habitat para aves migratorias y anfibios',
          'Reduccion de isla de calor urbana',
          'Centro de educacion ambiental para la comunidad',
        ],
        monitoreo: 'Mediciones mensuales de DBO, SST, nitrogenos y fosforo. Monitoreo de avifauna trimestral.',
        estado: 'activo',
        lat: 19.2568,
        lng: -99.0812,
        imagen: null,
      },
      {
        nombre: 'Humedal Artificial Parque Ecologico de Xochimilco',
        alcaldia: 'Xochimilco',
        ubicacion: 'Periferico Oriente 1, Cienagas de Xochimilco',
        tipoHumedal: 'conservacion',
        funcionPrincipal: 'Conservacion de habitat para ajolote mexicano y especies endemicas',
        superficie: 8000.0,
        volumen: 4500.0,
        capacidadTratamiento: null,
        anioImplementacion: '2019',
        vegetacion: ['Nymphaea mexicana', 'Typha domingensis', 'Bacopa monnieri', 'Eichhornia crassipes'],
        sustrato: 'Suelo lacustre natural + grava',
        usoAgua: 'Recirculacion para conservacion de fauna acuatica',
        serviciosEcosistemicos: ['biodiversidad', 'regulacion_hidrica', 'investigacion', 'recreacion'],
        serviciosDescripcion: [
          'Habitat critico para Ambystoma mexicanum (ajolote)',
          'Regulacion del nivel freatico en zona chinampera',
          'Estaciones de investigacion de la UNAM',
          'Senderos educativos abiertos al publico',
        ],
        monitoreo: 'Conteo de ajolotes semestral. Calidad de agua mensual. Inventario floristico anual.',
        estado: 'activo',
        lat: 19.2700,
        lng: -99.1040,
        imagen: null,
      },
      {
        nombre: 'Humedal Pluvial Bosque de Chapultepec',
        alcaldia: 'Miguel Hidalgo',
        ubicacion: 'Segunda seccion del Bosque de Chapultepec',
        tipoHumedal: 'captacion_pluvial',
        funcionPrincipal: 'Captacion y filtracion de agua pluvial para recarga de acuifero',
        superficie: 1500.0,
        volumen: 600.0,
        capacidadTratamiento: '30,000 litros/dia (temporada de lluvias)',
        anioImplementacion: '2023',
        vegetacion: ['Cyperus papyrus', 'Juncus effusus', 'Iris pseudacorus'],
        sustrato: 'Grava volcanica + arena silica + composta',
        usoAgua: 'Infiltracion al subsuelo y riego de areas verdes',
        serviciosEcosistemicos: ['recarga_acuifero', 'control_inundaciones', 'recreacion', 'educacion'],
        serviciosDescripcion: [
          'Infiltracion estimada de 15,000 m3/anio al acuifero',
          'Retencion de escorrentias durante lluvias intensas',
          'Area de contemplacion y descanso',
          'Senaletica informativa sobre ciclo del agua',
        ],
        monitoreo: 'Pluviometro automatizado. Mediciones de infiltracion trimestrales.',
        estado: 'en_expansion',
        lat: 19.4186,
        lng: -99.1980,
        imagen: null,
      },
    ]));
    console.log('  ObsHumedal: 3 records created');
  }

  // ── Hallazgos ──
  const hallazgoRepo = AppDataSource.getRepository(ObsHallazgo);
  if ((await hallazgoRepo.count()) === 0) {
    await hallazgoRepo.save(hallazgoRepo.create([
      {
        titulo: 'Deficit de humedales en zona oriente de CDMX',
        descripcion: 'Las alcaldias Iztapalapa, Tlahuac y Iztacalco presentan la menor densidad de infraestructura verde hidrica en relacion a su poblacion. Iztapalapa tiene 0.02 m2 de humedal por habitante vs el promedio de 0.15 m2 en la ciudad.',
        evidencia: ['Mapa de densidad de humedales por alcaldia', 'Datos censales INEGI 2020'],
        impacto: 'critico',
        recomendacion: {
          titulo: 'Plan de Humedales para la Zona Oriente',
          descripcion: 'Implementar al menos 5 humedales de tratamiento en parques publicos de Iztapalapa y Tlahuac aprovechando infraestructura existente.',
          acciones: [
            'Identificar 10 sitios candidatos en parques publicos >5000 m2',
            'Realizar estudios de factibilidad hidrologica',
            'Disenar humedales modulares replicables',
            'Gestionar presupuesto participativo 2026',
          ],
          responsables: ['SEDEMA', 'SACMEX', 'Alcaldias Iztapalapa y Tlahuac'],
          plazo: '18 meses',
          costoEstimado: '$45,000,000 MXN',
        },
      },
      {
        titulo: 'Alto potencial de techos verdes en edificios gubernamentales',
        descripcion: 'El 73% de los edificios gubernamentales de la alcaldia Cuauhtemoc cuentan con techos planos de losa de concreto con superficie promedio de 800 m2, ideales para instalacion de TVLE.',
        evidencia: ['Analisis de imagenes satelitales', 'Registro de inmuebles federales'],
        impacto: 'alto',
        recomendacion: {
          titulo: 'Programa Piloto de Techos Verdes Gubernamentales',
          descripcion: 'Iniciar con 10 edificios gubernamentales como proyecto demostrativo para escalar a nivel ciudad.',
          acciones: [
            'Seleccionar 10 edificios con mejor score de aptitud',
            'Realizar estudios estructurales',
            'Licitar instalacion de TVLE',
            'Implementar monitoreo con sensores IoT',
          ],
          responsables: ['SEDEMA', 'INDAABIN', 'Alcaldia Cuauhtemoc'],
          plazo: '12 meses',
          costoEstimado: '$18,000,000 MXN',
        },
      },
    ]));
    console.log('  ObsHallazgo: 2 records created');
  }

  // ── Notihumedal ──
  const notiRepo = AppDataSource.getRepository(ObsNotihumedal);
  if ((await notiRepo.count()) === 0) {
    await notiRepo.save(notiRepo.create([
      {
        titulo: 'CDMX inaugura nuevo humedal artificial en Xochimilco',
        slug: 'cdmx-inaugura-nuevo-humedal-artificial-en-xochimilco',
        resumen: 'La Secretaria del Medio Ambiente inauguro un humedal de tratamiento de 2,000 m2 que procesara aguas residuales para riego de chinampas.',
        contenido: '<p>El nuevo humedal artificial, ubicado en el barrio de San Gregorio Atlapulco, representa un avance significativo en la restauracion del sistema hidrologico de Xochimilco.</p>',
        css_content: null,
        editor_data: null,
        autor: 'Redaccion Observatorio',
        fecha: '2025-03-15',
        tags: ['xochimilco', 'humedal artificial', 'tratamiento de aguas'],
        imagen: null,
      },
      {
        titulo: 'Estudio revela beneficios de humedales urbanos en regulacion termica',
        slug: 'estudio-revela-beneficios-humedales-urbanos-regulacion-termica',
        resumen: 'Investigacion de la UNAM demuestra que los humedales artificiales reducen hasta 3 grados la temperatura en su entorno inmediato.',
        contenido: '<p>El estudio, publicado en la revista Urban Ecosystems, analizo datos de 15 humedales urbanos en la zona metropolitana durante dos anios.</p>',
        css_content: null,
        editor_data: null,
        autor: 'Dr. Maria Garcia - UNAM',
        fecha: '2025-02-28',
        tags: ['investigacion', 'isla de calor', 'UNAM'],
        imagen: null,
      },
    ]));
    console.log('  ObsNotihumedal: 2 records created');
  }

  // ── Prospectos de Noticias ──
  const prospectoRepo = AppDataSource.getRepository(ObsProspectoNoticia);
  if ((await prospectoRepo.count()) === 0) {
    const url1 = 'https://ejemplo.com/nota-humedales-cdmx-2025';
    const url2 = 'https://ejemplo.com/techos-verdes-norma-ambiental';
    await prospectoRepo.save(prospectoRepo.create([
      {
        titulo: 'Gobierno anuncia inversiones en infraestructura verde hidrica',
        resumen: 'Se destinaran 200 millones de pesos a la construccion de humedales artificiales en la zona oriente de CDMX.',
        url: url1,
        fuente: 'ejemplo.com',
        fecha: '2025-04-01',
        estado: 'pendiente',
        urlHash: crypto.createHash('sha256').update(url1.toLowerCase().trim()).digest('hex'),
        reviewedBy: null,
      },
      {
        titulo: 'Nueva norma ambiental para techos verdes en CDMX',
        resumen: 'La NADF propone hacer obligatoria la instalacion de techos verdes en nuevas construcciones mayores a 1000 m2.',
        url: url2,
        fuente: 'ejemplo.com',
        fecha: '2025-03-20',
        estado: 'pendiente',
        urlHash: crypto.createHash('sha256').update(url2.toLowerCase().trim()).digest('hex'),
        reviewedBy: null,
      },
    ]));
    console.log('  ObsProspectoNoticia: 2 records created');
  }

  // ── CMS Sections ──
  const cmsRepo = AppDataSource.getRepository(ObsCmsSection);
  if ((await cmsRepo.count()) === 0) {
    await cmsRepo.save(cmsRepo.create([
      {
        pageSlug: 'home',
        sectionKey: 'features',
        items: [
          { icon: 'leaf', title: 'Monitoreo en tiempo real', description: 'Seguimiento de indices de vegetacion y calidad del agua mediante sensores remotos.' },
          { icon: 'map', title: 'Mapa interactivo', description: 'Visualiza todos los humedales y techos verdes registrados en la CDMX.' },
          { icon: 'chart', title: 'Analisis con IA', description: 'Evaluacion automatizada de aptitud de techos y sitios candidatos.' },
        ],
        updatedBy: 'seed',
      },
      {
        pageSlug: 'home',
        sectionKey: 'stats',
        items: [
          { label: 'Humedales registrados', value: '45' },
          { label: 'Techos verdes activos', value: '128' },
          { label: 'Superficie total (m2)', value: '85,000' },
          { label: 'Alcaldias cubiertas', value: '12' },
        ],
        updatedBy: 'seed',
      },
    ]));
    console.log('  ObsCmsSection: 2 records created');
  }

  // ── Prospect Submissions ──
  const prospectRepo = AppDataSource.getRepository(ProspectSubmission);
  if ((await prospectRepo.count()) === 0) {
    await prospectRepo.save(prospectRepo.create([
      {
        observatory: 'techos-verdes',
        status: ProspectStatus.PENDIENTE,
        data: {
          nombre: 'Edificio Secretaria de Economia',
          alcaldia: 'Cuauhtemoc',
          lat: 19.4295,
          lng: -99.1579,
          superficie: 1500,
          tipoEdificio: 'gubernamental',
          scoreAptitud: 78,
        },
        source: ProspectSource.IA_DETECTOR,
        confianzaDetector: 'alta',
        notasAdmin: null,
        reviewedBy: null,
        reviewedAt: null,
      },
      {
        observatory: 'humedales',
        status: ProspectStatus.PENDIENTE,
        data: {
          nombre: 'Parque Ecologico Cuicuilco',
          alcaldia: 'Tlalpan',
          lat: 19.3020,
          lng: -99.1805,
          superficie: 5000,
          tipoHumedal: 'captacion_pluvial',
          descripcion: 'Area con potencial para humedal de captacion pluvial aprovechando escorrentia del cerro.',
        },
        source: ProspectSource.MANUAL,
        confianzaDetector: null,
        notasAdmin: null,
        reviewedBy: null,
        reviewedAt: null,
      },
    ]));
    console.log('  ProspectSubmission: 2 records created');
  }

  console.log('Observatory content seed complete');
}
