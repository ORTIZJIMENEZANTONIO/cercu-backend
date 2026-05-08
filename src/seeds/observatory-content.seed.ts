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
import { ObsHumedalTier } from '../entities/observatory/HumedalTier';
import { ObsHumedalContributor } from '../entities/observatory/HumedalContributor';
import { ObsTechosVerdesTier } from '../entities/observatory/TechosVerdesTier';
import { ObsTechosVerdesContributor } from '../entities/observatory/TechosVerdesContributor';
import * as crypto from 'crypto';

export async function seedObservatoryContent() {
  // ── Green Roofs (techos-verdes) ──
  const greenRoofRepo = AppDataSource.getRepository(ObsGreenRoof);
  if ((await greenRoofRepo.count()) === 0) {
    await greenRoofRepo.save(greenRoofRepo.create([
      { nombre: 'Techo Verde UNAM - Facultad de Ciencias', alcaldia: 'Coyoacan', direccion: 'Ciudad Universitaria, Circuito Exterior s/n', tipoEdificio: 'educativo', tipoTechoVerde: 'extensivo', superficie: 450.0, estado: 'activo', lat: 19.3262, lng: -99.1764, imagen: null, descripcion: 'Techo verde extensivo instalado como proyecto piloto de la Facultad de Ciencias.', fechaRegistro: '2023-06-15' },
      { nombre: 'Azotea Verde Reforma 222', alcaldia: 'Cuauhtemoc', direccion: 'Paseo de la Reforma 222', tipoEdificio: 'comercial', tipoTechoVerde: 'semi-intensivo', superficie: 1200.0, estado: 'activo', lat: 19.4270, lng: -99.1677, imagen: null, descripcion: 'Azotea verde semi-intensiva en edificio corporativo con area de descanso y huerto urbano.', fechaRegistro: '2022-03-10' },
      { nombre: 'Techo Verde Mercado de Coyoacan', alcaldia: 'Coyoacan', direccion: 'Calle Ignacio Allende s/n, Del Carmen', tipoEdificio: 'comercial', tipoTechoVerde: 'extensivo', superficie: 320.0, estado: 'mantenimiento', lat: 19.3497, lng: -99.1621, imagen: null, descripcion: 'Techo verde extensivo en el mercado municipal.', fechaRegistro: '2024-01-20' },
    ]));
    console.log('  ObsGreenRoof: 3 records created');
  }

  // ── Candidate Roofs ──
  const candidateRepo = AppDataSource.getRepository(ObsCandidateRoof);
  if ((await candidateRepo.count()) === 0) {
    await candidateRepo.save(candidateRepo.create([
      { nombre: 'Hospital General de Mexico', alcaldia: 'Cuauhtemoc', direccion: 'Dr. Balmis 148, Doctores', tipoEdificio: 'salud', superficie: 2800.0, scoreAptitud: 82.5, estatus: 'candidato', lat: 19.4117, lng: -99.1520, imagen: null, variables: { area: 0.9, rectangularidad: 0.85, niveles: 0.7, materialTecho: 0.9, pendiente: 0.95, obstrucciones: 0.6, accesibilidad: 0.8, cargaEstructural: 0.75 }, confianzaIA: 'alta', fechaPriorizacion: '2025-01-15' },
      { nombre: 'Palacio de Bellas Artes - Anexo', alcaldia: 'Cuauhtemoc', direccion: 'Av. Juarez s/n, Centro Historico', tipoEdificio: 'cultural', superficie: 950.0, scoreAptitud: 45.0, estatus: 'factibilidad_pendiente', lat: 19.4352, lng: -99.1413, imagen: null, variables: { area: 0.7, rectangularidad: 0.4, niveles: 0.5, materialTecho: 0.6, pendiente: 0.3, obstrucciones: 0.4, accesibilidad: 0.3, cargaEstructural: 0.5 }, confianzaIA: 'baja', fechaPriorizacion: '2025-02-01' },
    ]));
    console.log('  ObsCandidateRoof: 2 records created');
  }

  // ── Validation Records ──
  const validationRepo = AppDataSource.getRepository(ObsValidationRecord);
  if ((await validationRepo.count()) === 0) {
    await validationRepo.save(validationRepo.create([
      { candidatoId: 1, nombre: 'Hospital General de Mexico - Validacion Visual', imagen: null, prediccion: 'Techo plano de losa de concreto con pocas obstrucciones. Apto para TVLE.', confianza: 'alta', porcentajeConfianza: 88.5, estado: 'confirmado', revisadoPor: 'Admin Observatorios', fechaRevision: new Date('2025-02-10') },
    ]));
    console.log('  ObsValidationRecord: 1 record created');
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  HUMEDALES — Inventario Fase 1 (Dominguez Solis, 2025, CIIEMAD-IPN)
  //  + Luna-Pabello & Aburto-Castañeda (2014), TIP Rev., 17(1), 32-55
  //  + Ramirez-Carrillo, Luna-Pabello & Arredondo-Figueroa (2009), RMIQ, 8(1)
  // ══════════════════════════════════════════════════════════════════════════
  const humedalRepo = AppDataSource.getRepository(ObsHumedal);
  if ((await humedalRepo.count()) === 0) {
    await humedalRepo.save(humedalRepo.create([
      {
        nombre: 'Humedal Artificial Anfibium',
        alcaldia: 'Miguel Hidalgo',
        ubicacion: 'Bosque de Chapultepec, 2a Seccion',
        tipoHumedal: 'ha_fws',
        tipoVegetacion: ['emergente'],
        funcionPrincipal: 'Conservacion ex situ de anfibios (ajolotes)',
        superficie: 1200,
        anioImplementacion: '2023',
        vegetacion: ['Typha spp.', 'Carrizos', 'Sauces'],
        sustrato: 'Grava y suelo natural',
        usoAgua: 'Riego y limpieza interna',
        serviciosEcosistemicos: ['depuracion_agua', 'habitat_fauna', 'educacion_ambiental'],
        serviciosDescripcion: ['Eliminacion de nitrogeno y patogenos', 'Habitat de ajolotes', 'Educacion ambiental'],
        monitoreo: 'No se reportan datos cuantitativos publicos',
        estado: 'activo',
        lat: 19.4241, lng: -99.1896,
        imagen: '/images/humedales/anfibium.jpg',
        fuente: 'Inventario Fase 1 (Dominguez Solis, 2025)',
        fuenteImagen: 'Gobierno de la CDMX — Zoologico de Chapultepec / Anfibium',
      },
      {
        nombre: 'Humedal Artificial Parque Ecologico Cuitlahuac',
        alcaldia: 'Iztapalapa',
        ubicacion: 'Parque Ecologico Cuitlahuac, Iztapalapa',
        tipoHumedal: 'ha_sfs_horizontal',
        tipoVegetacion: ['emergente'],
        funcionPrincipal: 'Tratamiento de aguas y rehabilitacion ecologica',
        superficie: 8795,
        anioImplementacion: '2021-2023',
        vegetacion: ['Typha domingensis', 'Typha latifolia', 'Juncus effusus', 'Schoenoplectus spp.'],
        sustrato: 'Grava, arena y suelo original',
        usoAgua: 'Riego de areas verdes',
        serviciosEcosistemicos: ['depuracion_agua', 'habitat_fauna', 'captura_carbono'],
        serviciosDescripcion: ['Purificacion del agua', 'Habitat de aves', 'Captura de CO2'],
        monitoreo: 'Sin datos publicos detallados de eficiencia',
        estado: 'activo',
        lat: 19.3631, lng: -99.0444,
        imagen: '/images/humedales/cuitlahuac.jpg',
        fuente: 'Inventario Fase 1 (Dominguez Solis, 2025); Gobierno de la CDMX (2021)',
        fuenteImagen: 'Gobierno de la CDMX — Secretaria de Obras',
      },
      {
        nombre: 'Humedal Artificial Aragon — STHA (HAFSS + HAFS)',
        alcaldia: 'Gustavo A. Madero',
        ubicacion: 'Lago del Bosque de San Juan de Aragon, cuerpo sur',
        tipoHumedal: 'ha_hibrido',
        tipoVegetacion: ['emergente', 'sumergida', 'flotante'],
        funcionPrincipal: 'Control de eutroficacion del lago (120,000 m3) mediante sistema combinado HAFSS (2,351 m2) + HAFS (5,734 m2) + sedimentador (44 m2)',
        superficie: 8085,
        volumen: 120000,
        capacidadTratamiento: '250 m3/d (diseno); 175-260 m3/d segun epoca',
        anioImplementacion: '2012',
        vegetacion: ['Hidrofitas emergentes enraizadas', 'Hidrofitas subemergentes', 'Plantas de libre flotacion'],
        sustrato: 'HAFSS: grava de origen igneo + gravilla de roca caliza. Impermeabilizacion con geomembrana',
        usoAgua: 'Recirculacion al lago mayor del Bosque de Aragon',
        serviciosEcosistemicos: ['depuracion_agua', 'habitat_fauna', 'regulacion_termica', 'reduccion_lst', 'captura_carbono', 'educacion_ambiental', 'recreacion'],
        serviciosDescripcion: ['Remocion del 80% de contaminantes, >90% coliformes fecales', 'Habitat para aves migratorias', 'Mitigacion de isla de calor', 'Reduccion de LST', 'Fijacion de carbono', 'Educacion ambiental e investigación', 'Uso recreativo del lago'],
        monitoreo: 'Eficiencia documentada: 80% contaminantes generales, 50% nitrogeno (HAFSS), 50% fosforo (HAFS), >90% coliformes. Cumple NOM-001 y NOM-003 SEMARNAT. Inaugurado 30 nov 2012. Vida util: ~25 años. Fuente: Luna-Pabello & Aburto-Castaneda (2014), TIP Rev., 17(1), 32-55.',
        estado: 'activo',
        lat: 19.4602813, lng: -99.0739094,
        imagen: '/images/humedales/aragon-stha.jpg',
        fuente: 'Luna-Pabello, V.M. y Aburto-Castaneda, S. (2014). TIP Rev. Esp. Ciencias Químico-Biológicas, 17(1), 32-55. Facultad de Quimica, UNAM.',
        fuenteImagen: 'Fundacion UNAM (2020)',
      },
      {
        nombre: 'Segundo Humedal Artificial Aragon (HAFSS, diseno doble espiral)',
        alcaldia: 'Gustavo A. Madero',
        ubicacion: 'Bosque de San Juan de Aragon, zona sur',
        tipoHumedal: 'ha_sfs_horizontal',
        tipoVegetacion: ['emergente', 'flotante'],
        funcionPrincipal: 'Tratamiento de agua del lago mediante HAFSS con diseno de doble espiral',
        superficie: 3108,
        capacidadTratamiento: '140 m3/d',
        anioImplementacion: '2020 (ampliacion 2025)',
        vegetacion: ['Tules', 'Lirios acuaticos', 'Lentejilla de agua (Lemna)'],
        sustrato: 'Grava, filtro de agregados calcareos, tanque sedimentador y muro gavion filtrante',
        usoAgua: 'Recirculacion al lago mayor (capacidad combinada con STHA: 390 m3/d)',
        serviciosEcosistemicos: ['depuracion_agua', 'habitat_fauna', 'regulacion_termica', 'captura_carbono'],
        serviciosDescripcion: ['Remocion del 80% de contaminantes', 'Habitat de 50 spp aves acuaticas', 'Regulacion microclimatica', 'Captura de CO2'],
        monitoreo: '50 spp aves acuaticas (vs 25 en 2009). 80% remocion contaminantes. Fuente: DGCS-UNAM (2020), Boletin 150; Fundacion UNAM (2020).',
        estado: 'en_expansion',
        lat: 19.4618072, lng: -99.0734189,
        imagen: '/images/humedales/aragon-espiral.jpg',
        fuente: 'GAIA — Facultad de Quimica, UNAM; Fundacion UNAM (2020); DGCS-UNAM, Boletin 150/2020.',
        fuenteImagen: 'Gaceta UNAM (2020)',
      },
      {
        nombre: 'Humedal Artificial Playa de Aves',
        alcaldia: 'Gustavo A. Madero',
        ubicacion: 'Bosque de Aragon, zona sur',
        tipoHumedal: 'ha_fws',
        tipoVegetacion: ['emergente'],
        funcionPrincipal: 'Habitat de aves y recreacion ambiental',
        superficie: 1100,
        anioImplementacion: '2021',
        vegetacion: ['Carrizos', 'Plantas emergentes'],
        sustrato: 'Arena y grava',
        usoAgua: 'Descarga al lago del bosque',
        serviciosEcosistemicos: ['habitat_fauna', 'control_inundaciones', 'depuracion_agua'],
        serviciosDescripcion: ['Habitat de aves', 'Control de inundaciones', 'Filtracion previa al lago'],
        monitoreo: 'Se registran aves acuaticas y mejor filtracion',
        estado: 'activo',
        lat: 19.527, lng: -99.112,
        imagen: '/images/humedales/playa-aves.jpg',
        fuente: 'Gobierno de la CDMX (2021)',
        fuenteImagen: 'Gobierno de la CDMX (2021)',
      },
      {
        nombre: 'Humedal Artificial Cerro de la Estrella',
        alcaldia: 'Iztapalapa',
        ubicacion: 'Area Natural Protegida Cerro de la Estrella',
        tipoHumedal: 'ha_fws',
        tipoVegetacion: ['emergente'],
        funcionPrincipal: 'Rehabilitacion ecologica y captacion pluvial',
        anioImplementacion: '2022',
        vegetacion: ['Tules', 'Plantas polinizadoras nativas'],
        sustrato: 'Suelo natural y grava',
        usoAgua: 'Mantenimiento del espejo de agua',
        serviciosEcosistemicos: ['habitat_fauna', 'control_inundaciones', 'educacion_ambiental'],
        serviciosDescripcion: ['Recuperacion de biodiversidad', 'Control de escorrentia', 'Educacion ambiental'],
        monitoreo: 'Se reporta recuperacion de flora y fauna',
        estado: 'activo',
        lat: 19.331, lng: -99.107,
        imagen: '/images/humedales/cerro-estrella.jpg',
        fuente: 'Gobierno de la CDMX (2022)',
        fuenteImagen: 'Gobierno de la CDMX (2022)',
      },
      {
        nombre: 'Humedal Artificial Vivero San Luis Tlaxialtemalco',
        alcaldia: 'Xochimilco',
        ubicacion: 'Vivero San Luis Tlaxialtemalco, Xochimilco',
        tipoHumedal: 'ha_fws',
        tipoVegetacion: ['emergente', 'flotante', 'sumergida'],
        funcionPrincipal: 'Conservacion, filtracion y produccion vegetal',
        superficie: 48900,
        volumen: 13646,
        anioImplementacion: '2023',
        vegetacion: ['Typha', 'Juncus', 'Nymphaea', 'Nymphoides'],
        sustrato: 'Tierra natural y tezontle',
        usoAgua: 'Riego y posible recarga acuifera',
        serviciosEcosistemicos: ['banco_germoplasma', 'habitat_fauna', 'educacion_ambiental', 'recarga_acuiferos'],
        serviciosDescripcion: ['Banco de germoplasma', 'Refugio de fauna', 'Educacion ambiental', 'Recarga de acuiferos'],
        monitoreo: 'Se documenta produccion de plantas acuaticas nativas',
        estado: 'activo',
        lat: 19.284, lng: -99.093,
        imagen: '/images/humedales/vivero-tlaxialtemalco.jpg',
        fuente: 'Inventario Fase 1 (Dominguez Solis, 2025); La Cronica de Hoy (2023)',
        fuenteImagen: 'La Cronica de Hoy / Gobierno de la CDMX (2023)',
      },
      {
        nombre: 'Humedal Artificial CIBAC Cuemanco',
        alcaldia: 'Xochimilco',
        ubicacion: 'Centro de Investigaciónes Acuicolas de Cuemanco (CIBAC), UAM Xochimilco, Canal de Cuemanco',
        tipoHumedal: 'ha_sfs_vertical',
        tipoVegetacion: ['emergente'],
        funcionPrincipal: 'Tratamiento de agua del Canal de Cuemanco para acuicultura y proteccion de especies endemicas (ajolote)',
        superficie: 55,
        capacidadTratamiento: '4 m3/d (4 dosis de 1,000 L)',
        anioImplementacion: '2007',
        vegetacion: ['Arundo donax (carrizos)', 'Medicago sativa (alfalfa)', 'Zantedeschia aethiopica (alcatraces blancos)'],
        sustrato: 'Grava silica en dos horizontes: principal 0.6 m (particula 1-2 mm) + secundario 0.1 m (particula 1.5-2 cm); filtro de pulimento con minerales calizos (1.8 m2)',
        usoAgua: 'Acuicultura (cultivo de ajolote) y cultivos hidroponicos',
        serviciosEcosistemicos: ['depuracion_agua', 'habitat_fauna', 'educacion_ambiental'],
        serviciosDescripcion: ['Remocion: 92% DQO, 85% N-NH4, 80% PO4 (12 meses)', 'Agua para conservacion del ajolote', 'Investigación academica (UAM/UNAM)'],
        monitoreo: 'Monitoreo mensual 12 meses (mayo 2007 - mayo 2008). DQO 92%, N-NH4 85%, PO4 80%, N-NO2 60%, N-NO3 85%. Cumple NOM-001-SEMARNAT-1996. Vida util: 31.4 años (HA), 9.3 años (FP). Fuente: Ramirez-Carrillo, Luna-Pabello & Arredondo-Figueroa (2009), Rev. Mex. Ing. Quim., 8(1), 93-99.',
        estado: 'activo',
        lat: 19.2825, lng: -99.0940,
        imagen: '/images/humedales/cuemanco.jpg',
        fuente: 'Ramirez-Carrillo, H.F., Luna-Pabello, V.M. y Arredondo-Figueroa, J.L. (2009). Rev. Mex. Ing. Quim., 8(1), 93-99.',
        fuenteImagen: 'SEDEMA CDMX (2024)',
      },
      {
        nombre: 'SHATTO — Humedal Artificial Facultad de Quimica UNAM',
        alcaldia: 'Coyoacan',
        ubicacion: 'Facultad de Quimica, Ciudad Universitaria, UNAM. Contiguo a Auditorios A y B',
        tipoHumedal: 'ha_sfs_horizontal',
        tipoVegetacion: ['emergente'],
        funcionPrincipal: 'Tratamiento de aguas residuales de sanitarios mediante sistema de flujo subsuperficial (3 contenedores en serie: 2 flujo horizontal + 1 vertical) con sistema electroquimico acoplado',
        anioImplementacion: '2024',
        vegetacion: ['Carrizo (Arundo donax)', 'Iris spp.'],
        sustrato: 'Grava',
        usoAgua: 'Riego de areas verdes y mantenimiento de sanitarios',
        serviciosEcosistemicos: ['depuracion_agua', 'educacion_ambiental', 'captura_carbono'],
        serviciosDescripcion: ['Tratamiento de agua de sanitarios con sistema electroquimico + humedales subsuperficiales en serie', 'Investigacion, docencia, divulgacion e interaccion con estudiantes y academicos', 'Fijacion de CO2 y generacion de oxigeno por vegetacion depuradora y polinizadora'],
        monitoreo: 'Sistema inaugurado en junio 2024. Resultado de 34 anos de trabajo continuo del GAIA (Luna-Pabello, V.M.). Incluye celdas fotovoltaicas y captacion pluvial planificadas. 2 patentes.',
        estado: 'activo',
        lat: 19.3257, lng: -99.1800,
        imagen: '/images/humedales/shatto-fq.jpg',
        fuente: 'Facultad de Quimica, UNAM (2024); DGCS-UNAM, Boletin 489/2024; Gaceta UNAM (2024). Proyecto GAIA — Luna-Pabello, V.M.',
        fuenteImagen: 'Facultad de Quimica, UNAM — Comunicacion (2024)',
      },
      {
        nombre: 'Humedal Artificial ENCiT — Escuela Nacional de Ciencias de la Tierra, UNAM',
        alcaldia: 'Coyoacan',
        ubicacion: 'Escuela Nacional de Ciencias de la Tierra (ENCiT), Ciudad Universitaria, UNAM',
        tipoHumedal: 'ha_hibrido',
        tipoVegetacion: ['emergente'],
        funcionPrincipal: 'Tratamiento de aguas residuales de 12 sanitarios (3 niveles) mediante sistema hibrido (subsuperficial + superficial) con ecotecnologias integradas',
        superficie: 20,
        capacidadTratamiento: '400 L/d (entrada); 270-300 L/d recuperados',
        anioImplementacion: '2022',
        vegetacion: ['Sombrerillo (Hydrocotyle spp.)', 'Juncos (Juncus spp.)', 'Espadanas (Typha spp.)', 'Carrizos (Arundo donax)'],
        sustrato: 'Grava',
        usoAgua: 'Riego de areas verdes y reuso en mantenimiento',
        serviciosEcosistemicos: ['depuracion_agua', 'educacion_ambiental', 'habitat_fauna', 'captura_carbono'],
        serviciosDescripcion: ['Biorremediacion de aguas grises, cumple NOM-003-ECOL-1997', 'Espacio de formacion e investigacion en ecotecnologia', 'Conservacion de biodiversidad acuatica', 'Fijacion de CO2 por vegetacion acuatica emergente'],
        monitoreo: 'Operativo desde 2022, consolidado como ecosistema funcional en 2025. Cumple NOM-003-ECOL-1997. Modelo replicado en Fac. Quimica (SHATTO), Fac. Ciencias Politicas y Sociales, y planeado en CCH Sur. Coordinadora: Profa. Isabel Mejia Luna.',
        estado: 'activo',
        lat: 19.3295, lng: -99.1770,
        imagen: '/images/humedales/encit.jpg',
        fuente: 'Gaceta UNAM (2025). En la ENCiT consolidan humedal con ecotecnologia.',
        fuenteImagen: 'Gaceta UNAM (2025)',
      },
      {
        nombre: 'Humedal Artificial Experimental CIIEMAD-IPN',
        alcaldia: 'Gustavo A. Madero',
        ubicacion: 'Centro Interdisciplinario de Investigaciones y Estudios sobre Medio Ambiente y Desarrollo (CIIEMAD), IPN. Calle 30 de Junio de 1520 s/n, Barrio La Laguna Ticoman',
        tipoHumedal: 'ha_sfs_horizontal',
        tipoVegetacion: ['emergente'],
        funcionPrincipal: 'Tratamiento experimental de aguas grises residuales mediante flujo subsuperficial',
        anioImplementacion: '2024',
        vegetacion: ['Canna indica', 'Iris spp.'],
        sustrato: 'Tezontle, carbon activado y olote',
        usoAgua: 'Investigacion y tratamiento de aguas grises a nivel hogar',
        serviciosEcosistemicos: ['depuracion_agua', 'educacion_ambiental'],
        serviciosDescripcion: ['Remocion documentada: DBO5 92.07%, SST 81.31%, amonio 96.67%, fosforo 88.81%', 'Investigacion de posgrado y formacion en tecnologias de tratamiento basadas en la naturaleza (CIIEMAD-IPN)'],
        monitoreo: 'Eficiencias de remocion: DBO5 92.07%, SST 81.31%, amonio 96.67%, fosforo 88.81%. Sistema experimental vinculado a tesis de maestria CIIEMAD-IPN (Dominguez Solis, 2025).',
        estado: 'activo',
        lat: 19.5138995, lng: -99.1288954,
        imagen: '/images/humedales/ciiemad.jpg',
        fuente: 'Dominguez Solis, D. (2025). Humedal artificial: una solucion basada en la naturaleza para el tratamiento de aguas residuales a nivel hogar en la Colonia La Laguna Ticoman, CDMX. Tesis de maestria, CIIEMAD-IPN.',
        fuenteImagen: 'CIIEMAD-IPN (2025)',
      },
      {
        nombre: 'Humedales Artificiales San Mateo Tlaltenango — UAM Cuajimalpa',
        alcaldia: 'Cuajimalpa',
        ubicacion: 'Colegio Bilbao y viviendas del pueblo originario de San Mateo Tlaltenango, Alcaldia Cuajimalpa',
        tipoHumedal: 'ha_hibrido',
        tipoVegetacion: ['emergente'],
        funcionPrincipal: 'Tratamiento periurbano de aguas residuales domesticas mediante sistema hibrido (flujo horizontal + vertical) con biodigestor anaerobio, tanques de aireacion y desinfeccion',
        capacidadTratamiento: '~700 L/semana (~100 L/d) en Colegio Bilbao; 3 sistemas adicionales en viviendas',
        anioImplementacion: '2019',
        vegetacion: ['Cortaderia selloana (cola de zorro)', 'Arundo donax (carrizo)', 'Juncus spp. (junco triangular)'],
        sustrato: 'Grava',
        usoAgua: 'Recirculacion a sanitarios del colegio y riego',
        serviciosEcosistemicos: ['depuracion_agua', 'educacion_ambiental', 'captura_carbono'],
        serviciosDescripcion: ['Tratamiento de aguas residuales de sanitarios, cumple NOM-003-SEMARNAT-1997', 'Programa de talleres comunitarios de educacion ambiental y sensibilizacion', 'Captura de CO2 por vegetacion acuatica en ecosistema periurbano'],
        monitoreo: 'Inaugurado el 4 de noviembre de 2019. Proyecto Transformacion socio-tecnologica para el manejo sustentable del agua. Financiado por Conacyt y Royal Academy of Engineering (UK). Investigadoras: Dras. Miriam Alfie Cohen y Flor Yunuen Garcia Becerra (UAM Cuajimalpa).',
        estado: 'activo',
        lat: 19.3560, lng: -99.2890,
        imagen: '/images/humedales/cuajimalpa-smt.jpg',
        fuente: 'Semanario de la UAM, Ano 1, Num. 12, 11 de noviembre de 2019; UAM Cuajimalpa — Proyecto Humedales Regenerativos Periurbanos.',
        fuenteImagen: 'UAM Cuajimalpa — Proyecto Humedales Regenerativos Periurbanos (2019)',
      },
    ]));
    console.log('  ObsHumedal: 12 records created (Inventario Fase 1 + SHATTO + ENCiT + CIIEMAD + Cuajimalpa)');
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  HALLAZGOS — Inventario Fase 1 (Dominguez Solis, 2025)
  // ══════════════════════════════════════════════════════════════════════════
  const hallazgoRepo = AppDataSource.getRepository(ObsHallazgo);
  if ((await hallazgoRepo.count()) === 0) {
    await hallazgoRepo.save(hallazgoRepo.create([
      {
        titulo: 'Ausencia de monitoreo estandarizado',
        descripcion: 'La mayoria de los humedales inventariados carecen de datos cuantitativos de desempeno. Solo 2 de 7 registros presentan informacion parcial de eficiencia.',
        evidencia: [
          'Solo 2-3 de los 8 humedales cuentan con datos cuantitativos parciales de remocion.',
          'La mayoria indica "No se reportan datos de monitoreo cuantitativo".',
          'No existe un protocolo comun de medicion entre alcaldias.',
          'Las fuentes publicas reportan capacidades de diseno, pero no resultados operativos.',
        ],
        impacto: 'critico',
        recomendacion: {
          titulo: 'Implementar protocolo de monitoreo estandarizado',
          descripcion: 'Establecer un protocolo unificado con parametros fisicoquímicos y microbiologicos clave.',
          acciones: ['Definir parametros minimos: DQO, nitrogeno total, fosforo total, coliformes fecales y caudal.', 'Establecer frecuencia trimestral de muestreo.', 'Crear plataforma de datos abiertos.', 'Capacitar personal operativo en tecnicas de muestreo.'],
          responsables: ['CIIEMAD-IPN', 'CONAGUA'],
          plazo: 'corto',
          costoEstimado: '$500,000 - $1,500,000 MXN por humedal',
        },
      },
      {
        titulo: 'Concentracion territorial desigual',
        descripcion: 'Los 8 humedales se ubican en solo 5 de las 16 alcaldias. Las 11 restantes no cuentan con ningun humedal artificial inventariado.',
        evidencia: [
          'Solo 5 de 16 alcaldias (31%) cuentan con al menos un humedal.',
          '11 alcaldias no tienen ningun humedal artificial.',
          'Iztapalapa y Gustavo A. Madero concentran multiples instalaciones.',
          'Alcaldias con alta necesidad hidrica (Iztacalco, Venustiano Carranza, Tlahuac) carecen de humedales.',
        ],
        impacto: 'alto',
        recomendacion: {
          titulo: 'Priorizar expansion con indice de necesidad territorial',
          descripcion: 'Disenar estrategia de expansion que priorice alcaldias sin cobertura usando indice compuesto de necesidad.',
          acciones: ['Construir indice por alcaldia (estres hidrico, inundaciones, islas de calor, densidad).', 'Priorizar Iztacalco, Venustiano Carranza y Tlahuac.', 'Elaborar estudios de factibilidad para al menos 3 nuevos humedales.', 'Vincular con programas de desarrollo urbano.'],
          responsables: ['Gobierno de la CDMX', 'Alcaldias prioritarias'],
          plazo: 'mediano',
        },
      },
      {
        titulo: 'Datos de eficiencia limitados a estudios piloto',
        descripcion: 'Las tasas de remocion reportadas (50-95%) provienen de estudios piloto academicos, no de mediciones in situ de los humedales operativos.',
        evidencia: [
          'Los estudios de la UNAM y UAM reportan eficiencias de 50-95% en condiciones experimentales.',
          'Dichas mediciones corresponden a pilotos academicos, no a los humedales del inventario.',
          'No existen datos publicados de eficiencia in situ para los 8 humedales inventariados.',
          'Las condiciones reales pueden reducir significativamente la eficiencia.',
        ],
        impacto: 'alto',
        recomendacion: {
          titulo: 'Establecer convenios universidad-gobierno para monitoreo in situ',
          descripcion: 'Formalizar alianzas con instituciones academicas para mediciones de eficiencia directamente en los humedales operativos.',
          acciones: ['Firmar convenios con UNAM, UAM, UACh e IPN para monitoreo in situ.', 'Disenar campanas de muestreo estacional (minimo 4/ano).', 'Comparar resultados de campo con estudios piloto.', 'Publicar reportes tecnicos anuales.'],
          responsables: ['IPN', 'UNAM'],
          plazo: 'mediano',
          costoEstimado: '$2,000,000 - $5,000,000 MXN (programa integral)',
        },
      },
      {
        titulo: 'Ventaja economica no cuantificada formalmente',
        descripcion: 'Los humedales presentan costos de $0.50-$2.00 MXN/m3 vs $5-15 MXN/m3 de plantas convencionales (Nava-Rojas et al., 2023; CONAGUA), pero no existe analisis costo-beneficio formal.',
        evidencia: [
          'Costo estimado: ~$0.50-2.00 MXN/m3 vs $5-15 MXN/m3 convencional (Nava-Rojas et al., 2023; CONAGUA).',
          'Los 8 humedales podrian procesar ~2,890 m3/dia en conjunto.',
          'Ningun documento publico presenta analisis formal de costo-beneficio.',
          'La ausencia de argumentos economicos dificulta justificar nuevas inversiones.',
        ],
        impacto: 'alto',
        recomendacion: {
          titulo: 'Realizar analisis costo-beneficio formal',
          descripcion: 'Elaborar estudio que compare humedales con tratamientos convencionales documentando la ventaja economica.',
          acciones: ['Desarrollar analisis de costos de inversion, operacion y externalidades.', 'Cuantificar servicios ecosistemicos co-producidos.', 'Documentar para tomadores de decision.', 'Presentar ante comisiones del Congreso de la CDMX.'],
          responsables: ['CONAGUA', 'Academia (IPN, UNAM)'],
          plazo: 'corto',
        },
      },
    ]));
    console.log('  ObsHallazgo: 4 records created (Inventario Fase 1)');
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  NOTIHUMEDAL — Artículos con imagenes y fuentes
  // ══════════════════════════════════════════════════════════════════════════
  const notiRepo = AppDataSource.getRepository(ObsNotihumedal);
  if ((await notiRepo.count()) === 0) {
    await notiRepo.save(notiRepo.create([
      {
        titulo: 'Inauguran segundo humedal artificial en el Bosque de Aragon',
        slug: 'segundo-humedal-aragon-2020',
        resumen: 'La Facultad de Quimica de la UNAM, a traves del grupo GAIA, inauguro el segundo humedal artificial de flujo subsuperficial en el Bosque de San Juan de Aragon con capacidad de 140 m3/dia.',
        contenido: '<p>El Grupo Academico Interdisciplinario Ambiental (GAIA) de la Facultad de Quimica, UNAM, inauguro un segundo sistema de humedales artificiales en el Bosque de San Juan de Aragon (DGCS-UNAM, Boletin 150/2020).</p><p>El nuevo sistema cuenta con una superficie de 3,108 m2 y una capacidad de tratamiento de 140,000 litros diarios. Con este segundo humedal, el Bosque de Aragon se consolida como el sitio con mayor infraestructura de humedales artificiales en la CDMX, con capacidad combinada de 390 m3/dia.</p>',
        autor: 'Observatorio de Humedales Artificiales CDMX',
        fecha: '2020-11-15',
        tags: ['Aragon', 'GAIA', 'UNAM', 'flujo subsuperficial'],
        imagen: '/images/humedales/aragon.jpg',
        fuenteImagen: 'Gaceta UNAM / Facultad de Quimica, UNAM',
      },
      {
        titulo: 'Humedales de la CDMX: generadores de agua y refugio de biodiversidad',
        slug: 'humedales-cdmx-politica-publica',
        resumen: 'La Ciudad de Mexico alberga humedales que registran 397 especies de aves y capturan hasta 10 veces mas carbono que las selvas tropicales, segun la CONABIO.',
        contenido: '<p>Con motivo del Dia Mundial de los Humedales, diversas instituciones presentaron un balance del estado de los humedales en la Ciudad de Mexico.</p><p>Entre los humedales artificiales documentados se encuentran el STHA del Bosque de Aragon (Luna-Pabello & Aburto-Castaneda, 2014) y el Parque Ecologico Cuitlahuac.</p>',
        autor: 'Observatorio de Humedales Artificiales CDMX',
        fecha: '2023-02-02',
        tags: ['CONABIO', 'politica publica', 'biodiversidad'],
        imagen: '/images/humedales/playa-aves.jpg',
        fuenteImagen: 'Gobierno de la CDMX',
      },
      {
        titulo: 'Artículo científico: STHA del Bosque de Aragon — 30 años de investigación',
        slug: 'luna-pabello-stha-aragon-2014',
        resumen: 'Luna-Pabello y Aburto-Castaneda publican en TIP Revista el diseno y resultados del STHA del lago del Bosque de Aragon.',
        contenido: '<p>En la revista TIP Rev. Esp. Ciencias Químico-Biológicas, 17(1), 32-55, los investigadores de la Facultad de Quimica de la UNAM documentan el STHA.</p><p>El sistema combina HAFSS (2,351 m2) con HAFS (5,734 m2) para controlar la eutroficacion del lago. Remocion: 80% contaminantes, >90% coliformes fecales.</p>',
        autor: 'Luna-Pabello, V.M. / GAIA-UNAM',
        fecha: '2014-06-01',
        tags: ['investigación', 'UNAM', 'Aragon', 'HAFSS', 'HAFS'],
        imagen: '/images/humedales/aragon.jpg',
        fuenteImagen: 'Gaceta UNAM / GAIA — Facultad de Quimica, UNAM',
      },
    ]));
    console.log('  ObsNotihumedal: 3 records created');
  }

  // ── Prospectos de Noticias ──
  const prospectoRepo = AppDataSource.getRepository(ObsProspectoNoticia);
  if ((await prospectoRepo.count()) === 0) {
    const url1 = 'https://www.fundacionunam.org.mx/donde-paso/unam-inaugura-humedal-artificial-en-el-bosque-de-san-juan-de-aragon/';
    await prospectoRepo.save(prospectoRepo.create([
      {
        titulo: 'UNAM inaugura humedal artificial en el Bosque de San Juan de Aragon',
        resumen: 'La Facultad de Quimica de la UNAM inauguro un segundo sistema de humedales artificiales.',
        url: url1,
        fuente: 'Fundacion UNAM',
        fecha: '2020-11-15',
        estado: 'aprobado',
        urlHash: crypto.createHash('sha256').update(url1.toLowerCase().trim()).digest('hex'),
        reviewedBy: null,
      },
    ]));
    console.log('  ObsProspectoNoticia: 1 record created');
  }

  // ── CMS Sections (humedales) ──
  const cmsRepo = AppDataSource.getRepository(ObsCmsSection);
  const humedalesCmsCount = await cmsRepo.count({ where: { observatory: 'humedales' } });
  if (humedalesCmsCount === 0) {
    // Set CMS completo de humedales — espejo de cms-defaults.ts del frontend.
    // El usuario puede editarlo todo via /admin/contenido. Si la BBDD ya tiene
    // alguna seccion humedales, este bloque NO corre; en ese caso usar la
    // migracion 1740-SeedExpandedCmsSections para upsert por seccion.
    await cmsRepo.save(cmsRepo.create([
      // ── home ──
      {
        observatory: 'humedales', pageSlug: 'home', sectionKey: 'hero',
        items: [{
          eyebrow: 'Plataforma abierta',
          titleLine1: 'Observatorio de',
          titleLine2: 'Humedales Artificiales',
          titleLine3: 'CDMX',
          subtitle: 'Monitoreo, inventario y analisis de humedales artificiales en la Ciudad de Mexico. Infraestructura verde y soluciones basadas en la naturaleza.',
          primaryLabel: 'Explorar inventario',
          primaryTo: '/inventario',
          primaryIcon: 'lucide:compass',
          secondaryLabel: 'Registra tu humedal',
          secondaryTo: '/registra',
        }],
        updatedBy: 'seed',
      },
      {
        observatory: 'humedales', pageSlug: 'home', sectionKey: 'features',
        items: [
          { title: 'Inventario geoespacial', description: 'Localizacion y caracterizacion de humedales artificiales en la Ciudad de Mexico.', to: '/inventario', bg: 'bg-primary-50', iconColor: 'text-primary', icon: 'lucide:map-pin' },
          { title: 'Servicios ecosistemicos', description: 'Analisis de beneficios ambientales: tratamiento de agua, habitat para fauna, captura de carbono.', to: '/analisis/indicadores', bg: 'bg-eco/10', iconColor: 'text-eco', icon: 'lucide:droplets' },
          { title: 'Metodologia cientifica', description: 'Sistematizacion basada en criterios tecnicos: clasificacion del HA por sistema de flujo (FWS, SFS).', to: '/sobre#metodologia', bg: 'bg-secondary/10', iconColor: 'text-secondary', icon: 'lucide:microscope' },
        ],
        updatedBy: 'seed',
      },
      {
        observatory: 'humedales', pageSlug: 'home', sectionKey: 'steps',
        items: [
          { title: 'Identificacion', description: 'Localizacion de humedales artificiales existentes en la CDMX mediante fuentes oficiales, academicas y de trabajo de campo.' },
          { title: 'Caracterizacion', description: 'Documentacion de tipo, vegetacion, sustrato, superficie y capacidad de tratamiento.' },
          { title: 'Analisis', description: 'Evaluacion de servicios ecosistemicos y comparacion entre tipologias de humedales.' },
          { title: 'Visualizacion', description: 'Presentacion interactiva en mapas y graficas para tomadores de decisiones.' },
        ],
        updatedBy: 'seed',
      },
      {
        observatory: 'humedales', pageSlug: 'home', sectionKey: 'tipologias',
        items: [
          { title: 'HA flujo superficial (FWS)', description: 'El agua fluye visiblemente sobre el sustrato, similar a un humedal natural.', examples: 'Anfibium, Playa de Aves, Vivero Tlaxialtemalco, Cerro de la Estrella', badge: 'FWS', badgeClass: 'badge-secondary' },
          { title: 'HA flujo subsuperficial (SFS)', description: 'El agua fluye a traves del sustrato sin ser visible en la superficie.', examples: 'Parque Ecologico Cuitlahuac, Segundo Aragon, CIBAC Cuemanco', badge: 'HSSF', badgeClass: 'badge-primary' },
          { title: 'HA hibrido (FWS + SFS)', description: 'Combina modulos de flujo superficial y subsuperficial en serie.', examples: 'Aragon STHA (HAFSS + HAFS)', badge: 'Hibrido', badgeClass: 'badge-eco' },
        ],
        updatedBy: 'seed',
      },
      {
        observatory: 'humedales', pageSlug: 'home', sectionKey: 'servicios',
        items: [
          { title: 'Tratamiento de agua', icon: 'lucide:droplets' },
          { title: 'Habitat para fauna', icon: 'lucide:bird' },
          { title: 'Captura de carbono', icon: 'lucide:leaf' },
          { title: 'Regulacion termica', icon: 'lucide:thermometer' },
          { title: 'Control de inundaciones', icon: 'lucide:waves' },
          { title: 'Educacion ambiental', icon: 'lucide:book-open' },
        ],
        updatedBy: 'seed',
      },
      // ── sobre ──
      {
        observatory: 'humedales', pageSlug: 'sobre', sectionKey: 'objetivos',
        items: [
          { title: 'Sistematizar', description: 'Organizar la informacion dispersa sobre humedales artificiales en la CDMX en un repositorio accesible.', icon: '📋' },
          { title: 'Visualizar', description: 'Mostrar la distribucion geoespacial y caracteristicas tecnicas de cada humedal en mapas interactivos.', icon: '🗺️' },
          { title: 'Analizar', description: 'Evaluar los servicios ecosistemicos y su contribucion a la sustentabilidad urbana de la ciudad.', icon: '📊' },
        ],
        updatedBy: 'seed',
      },
      {
        observatory: 'humedales', pageSlug: 'sobre', sectionKey: 'criterios',
        items: [
          { title: 'Ubicacion y año', description: 'Coordenadas geograficas y año de implementacion.', icon: '📍' },
          { title: 'Tipo de humedal artificial', description: 'Clasificacion por sistema de flujo: HA de flujo superficial (FWS), HA de flujo subsuperficial horizontal (HSSF) o vertical (VSSF), y sistemas hibridos.', icon: '🏷️' },
          { title: 'Caracteristicas tecnicas', description: 'Vegetacion, sustrato, volumen o superficie documentada.', icon: '🔬' },
          { title: 'Uso del agua tratada', description: 'Destino del agua procesada: riego, recirculacion, infiltracion.', icon: '💧' },
          { title: 'Servicios ecosistemicos', description: 'Beneficios ambientales: depuracion, habitat, captura de carbono.', icon: '🌿' },
          { title: 'Resultados o monitoreo', description: 'Datos cuantitativos o cualitativos de desempeno.', icon: '📊' },
        ],
        updatedBy: 'seed',
      },
      {
        observatory: 'humedales', pageSlug: 'sobre', sectionKey: 'normativas',
        items: [
          { title: 'Ley de Aguas de la CDMX', description: 'Marco regulatorio para el manejo integral del agua en la Ciudad de Mexico.' },
          { title: 'Programa de Medio Ambiente CDMX', description: 'Estrategia de sustentabilidad que incluye infraestructura verde.' },
          { title: 'NOM-001-SEMARNAT-2021', description: 'Limites permisibles de contaminantes en descargas de aguas residuales.' },
          { title: 'ODS 6 — Agua limpia y saneamiento', description: 'Garantizar la disponibilidad y gestion sostenible del agua.' },
          { title: 'ODS 11 — Ciudades sostenibles', description: 'Lograr que ciudades sean inclusivas, seguras, resilientes y sostenibles.' },
          { title: 'ODS 15 — Vida de ecosistemas terrestres', description: 'Proteger, restaurar y promover el uso sostenible de los ecosistemas.' },
        ],
        updatedBy: 'seed',
      },
      // ── analisis hub ──
      {
        observatory: 'humedales', pageSlug: 'analisis', sectionKey: 'sections',
        items: [
          { to: '/analisis/indicadores', title: 'Indicadores y distribucion', description: 'Graficas de distribucion geografica, tipologica y de servicios ecosistemicos.', icon: 'lucide:bar-chart-3', bg: 'bg-primary-50', iconColor: 'text-primary', accentColor: 'bg-primary' },
          { to: '/analisis/brecha', title: 'Brecha de cobertura', description: 'Analisis de las 16 alcaldias: indice de necesidad, mapa de cobertura y ranking de prioridad.', icon: 'lucide:map', bg: 'bg-eco/10', iconColor: 'text-eco', accentColor: 'bg-eco' },
          { to: '/analisis/hallazgos', title: 'Hallazgos y recomendaciones', description: 'Sintesis del inventario Fase 1, comparativo de costos y propuestas para la politica publica.', icon: 'lucide:lightbulb', bg: 'bg-accent/10', iconColor: 'text-accent-dark', accentColor: 'bg-accent' },
        ],
        updatedBy: 'seed',
      },
      // ── inventario ──
      { observatory: 'humedales', pageSlug: 'inventario', sectionKey: 'hero', items: [{ title: 'Inventario de humedales', subtitle: 'Sistema de busqueda, filtros y vista detallada de los humedales artificiales documentados en CDMX.', cta: 'Registra un humedal', ctaLink: '/registra' }], updatedBy: 'seed' },
      { observatory: 'humedales', pageSlug: 'inventario', sectionKey: 'helpText', items: [{ title: '¿Que encontraras aqui?', description: 'Cada tarjeta muestra el tipo de humedal (FWS / SFS / Hibrido), año, alcaldia, vegetacion y servicios ecosistemicos documentados. Toca una tarjeta para ver la ficha completa.' }], updatedBy: 'seed' },
      // ── mapa ──
      { observatory: 'humedales', pageSlug: 'mapa', sectionKey: 'hero', items: [{ title: 'Mapa interactivo', subtitle: 'Distribucion geografica de los humedales artificiales en la CDMX. Cada marcador despliega los datos clave del sitio.', cta: 'Ver inventario', ctaLink: '/inventario' }], updatedBy: 'seed' },
      { observatory: 'humedales', pageSlug: 'mapa', sectionKey: 'legend', items: [
        { color: 'bg-primary', label: 'Activo', description: 'Humedal en operacion regular' },
        { color: 'bg-accent', label: 'En expansion', description: 'En construccion de etapa nueva' },
        { color: 'bg-secondary', label: 'Piloto', description: 'Demostrativo o experimental' },
        { color: 'bg-slate-400', label: 'Pendiente verificacion', description: 'Sitio reportado sin confirmacion oficial' },
      ], updatedBy: 'seed' },
      // ── notihumedal ──
      { observatory: 'humedales', pageSlug: 'notihumedal', sectionKey: 'hero', items: [{ title: 'Notihumedal', subtitle: 'Notas, comunicados y publicaciones recientes sobre humedales artificiales en CDMX y Mexico.', cta: '', ctaLink: '' }], updatedBy: 'seed' },
      { observatory: 'humedales', pageSlug: 'notihumedal', sectionKey: 'emptyState', items: [{ title: 'Aun no hay articulos', description: 'Los nuevos articulos publicados apareceran aqui. Tambien puedes seguirnos por RSS.' }], updatedBy: 'seed' },
      // ── registra ──
      { observatory: 'humedales', pageSlug: 'registra', sectionKey: 'hero', items: [{ title: 'Registra un humedal', subtitle: 'Aporta tu conocimiento al observatorio. Tu reporte pasa por revision de un especialista antes de publicarse.', cta: '', ctaLink: '' }], updatedBy: 'seed' },
      { observatory: 'humedales', pageSlug: 'registra', sectionKey: 'steps', items: [
        { title: 'Paso 1', label: 'Datos tecnicos', description: 'Ubicacion, tipo de flujo, vegetacion, sustrato y capacidad. Llena lo que tengas; los campos opcionales se pueden completar despues.' },
        { title: 'Paso 2', label: 'Documento de respaldo', description: 'Si tienes un PDF, paper o reporte que documente el humedal, subelo o pega el enlace. Es opcional pero acelera la verificacion.' },
        { title: 'Paso 3', label: 'Confirmacion', description: 'Revisa el resumen y envia. Recibiras respuesta del equipo en 5-10 dias habiles.' },
      ], updatedBy: 'seed' },
      { observatory: 'humedales', pageSlug: 'registra', sectionKey: 'confirmation', items: [{ title: '¡Gracias por tu aporte!', description: 'Tu reporte entro a la cola de revision. Si proporcionaste correo, te avisaremos del resultado.' }], updatedBy: 'seed' },
      // ── analisis-* ──
      { observatory: 'humedales', pageSlug: 'analisis-indicadores', sectionKey: 'hero', items: [{ title: 'Indicadores', subtitle: 'Distribucion, servicios ecosistemicos, comparativa tecnica y evidencia cientifica.' }], updatedBy: 'seed' },
      { observatory: 'humedales', pageSlug: 'analisis-indicadores', sectionKey: 'tabs', items: [
        { id: 'distribucion', label: 'Distribucion', description: 'Por alcaldia, tipologia y superficie' },
        { id: 'servicios', label: 'Servicios ecosistemicos', description: 'Frecuencia y matriz humedal x servicio' },
        { id: 'comparativo', label: 'Analisis comparativo', description: 'Timeline + tabla tecnica completa' },
        { id: 'evidencia', label: 'Evidencia cientifica', description: 'Eficiencias documentadas y respaldo academico' },
      ], updatedBy: 'seed' },
      { observatory: 'humedales', pageSlug: 'analisis-brecha', sectionKey: 'hero', items: [{ title: 'Brecha de cobertura', subtitle: 'Las 9 alcaldias sin humedal artificial vs. las 7 que ya tienen. Indice de necesidad y ranking.' }], updatedBy: 'seed' },
      { observatory: 'humedales', pageSlug: 'analisis-brecha', sectionKey: 'methodology', items: [{ title: 'Como se calcula el indice de necesidad', description: 'IN = (inundacion x 0.30) + (calor x 0.25) + (escasez de agua x 0.30) + (densidad poblacional normalizada x 0.15). Escalas 1-5 ordinales.' }], updatedBy: 'seed' },
      { observatory: 'humedales', pageSlug: 'analisis-hallazgos', sectionKey: 'hero', items: [{ title: 'Hallazgos y recomendaciones', subtitle: 'Sintesis del inventario Fase 1: 4 hallazgos, recomendaciones de politica publica y comparativo de costos.' }], updatedBy: 'seed' },
      { observatory: 'humedales', pageSlug: 'analisis-hallazgos', sectionKey: 'callToAction', items: [{ title: 'Quiero participar en politica publica', description: 'Si representas a una alcaldia, dependencia o universidad y quieres explorar implementar humedales artificiales, escribenos.', cta: 'Contacto', ctaLink: '/sobre' }], updatedBy: 'seed' },
      // ── contributors (red de tiers) ──
      { observatory: 'humedales', pageSlug: 'contributors', sectionKey: 'hero', items: [{ title: 'Red de contribuyentes', subtitle: 'Personas, instituciones y comunidades que aportan al observatorio. Cinco modos de participacion.' }], updatedBy: 'seed' },
      { observatory: 'humedales', pageSlug: 'contributors', sectionKey: 'intro', items: [{ title: 'Cinco modos de participacion', description: 'Cada modo es una forma distinta de aportar (no un nivel a alcanzar). Aprendiz reporta, Observador da seguimiento, Caracterizador mide, Especialista investiga, Custodio resguarda.' }], updatedBy: 'seed' },
      // ── footer ──
      { observatory: 'humedales', pageSlug: 'footer', sectionKey: 'brand', items: [{ title: 'Observatorio de Humedales Artificiales CDMX', subtitle: 'Una iniciativa CIIEMAD-IPN', description: 'Plataforma de monitoreo, inventario y analisis de humedales artificiales en la Ciudad de Mexico.' }], updatedBy: 'seed' },
      { observatory: 'humedales', pageSlug: 'footer', sectionKey: 'sources', items: [
        { label: 'CIIEMAD - IPN', href: 'https://www.ciiemad.ipn.mx' },
        { label: 'CONAGUA - Inventario Nacional de Humedales', href: 'https://sigagis.conagua.gob.mx/humedales/' },
        { label: 'CONABIO - SIMOH-Mx', href: 'https://www.biodiversidad.gob.mx/monitoreo/simoh-mx' },
        { label: 'OpenStreetMap (Overpass API)', href: 'https://overpass-api.de' },
      ], updatedBy: 'seed' },
      { observatory: 'humedales', pageSlug: 'footer', sectionKey: 'quickLinks', items: [
        { label: 'Mapa', to: '/mapa' },
        { label: 'Inventario', to: '/inventario' },
        { label: 'Analisis', to: '/analisis' },
        { label: 'Notihumedal', to: '/notihumedal' },
        { label: 'Sobre', to: '/sobre' },
        { label: 'Registra un humedal', to: '/registra' },
      ], updatedBy: 'seed' },
      { observatory: 'humedales', pageSlug: 'footer', sectionKey: 'legal', items: [{ body: 'Plataforma de datos abiertos. Licencia de software Apache 2.0. Contenido editorial bajo licencia CC BY 4.0 con atribucion al inventario Fase 1 (Dominguez Solis, CIIEMAD-IPN).', copyright: '© 2026 Observatorio de Humedales Artificiales CDMX.' }], updatedBy: 'seed' },
    ]));
    console.log('  ObsCmsSection (humedales): ~25 records created (CMS expandido)');
  }

  // ── CMS Sections (arrecifes) ──
  // Migra el copy hardcodeado de los .vue al CMS para que /admin/contenido lo
  // pueda editar. Cada bloque nuevo aquí debe espejar la estructura del default
  // en `observatorio-arrecifes/data/cms-defaults.ts`.
  const arrecifesCmsCount = await cmsRepo.count({ where: { observatory: 'arrecifes' } });
  if (arrecifesCmsCount === 0) {
    await cmsRepo.save(cmsRepo.create([
      // ── HOME ──
      { observatory: 'arrecifes', pageSlug: 'home', sectionKey: 'hero', items: [{ eyebrow: 'Datos en tiempo casi real · NOAA · NASA · ESA', titleLine1: 'Observatorio', titleLine2Prefix: 'de', titleLine2Highlight: 'Arrecifes Vivos', titleLine3: 'de México', subtitle: 'Una plataforma viva. Mapas satelitales actualizados a diario, capas abiertas descargables y una red verificada de pescadores, buzos, comunidades costeras y científicos que documentan lo que pasa bajo el agua.', primaryLabel: 'Abrir mapa vivo', primaryTo: '/livemap', secondaryLabel: 'Contribuir', secondaryTo: '/contribute' }], updatedBy: 'seed' },
      { observatory: 'arrecifes', pageSlug: 'home', sectionKey: 'features', items: [
        { icon: 'lucide:satellite', title: 'Datos satelitales casi en tiempo real', description: 'NOAA Coral Reef Watch (DHW, alertas de blanqueamiento), NASA MODIS/PACE (SST, clorofila), ESA Sentinel-2 (10 m), USGS Landsat. Reproyectados sobre la línea costera mexicana.', linkLabel: 'Abrir mapa', linkTo: '/livemap', accent: 'primary' },
        { icon: 'lucide:alert-triangle', title: 'Atlas de conflictos socioambientales', description: 'Quién impulsa, quién resiste, qué especies se afectan. Casos documentados de cruceros, sargazo, derrames, sobrepesca y desarrollo costero — con evidencia.', linkLabel: 'Ver atlas', linkTo: '/atlas', accent: 'coral' },
        { icon: 'lucide:users', title: 'Red verificada de colaboradores', description: 'Pescadores, buzos, investigadoras, comunidades costeras. Sistema de reputación tipo marketplace: bronce → coral según aportes validados, calidad y consistencia.', linkLabel: 'Ver red', linkTo: '/contributors', accent: 'eco' },
      ], updatedBy: 'seed' },
      { observatory: 'arrecifes', pageSlug: 'home', sectionKey: 'sectionTitle', items: [{ eyebrow: '¿Qué hay aquí?', title: 'Una plataforma viva, no un reporte estático', subtitle: 'Inspirada en Allen Coral Atlas (mapas satelitales globales) y EJAtlas (cartografía de conflictos socioambientales). Pensada para México, en español y desde lo costero.' }], updatedBy: 'seed' },
      { observatory: 'arrecifes', pageSlug: 'home', sectionKey: 'alerts', items: [{ eyebrow: 'Últimas 72 h', title: 'Alertas activas', subtitle: 'NOAA Coral Reef Watch · 5 km · actualizado diariamente.', linkLabel: 'Ver mapa de alertas', linkTo: '/livemap?layer=noaa-crw-bleaching-alert' }], updatedBy: 'seed' },
      { observatory: 'arrecifes', pageSlug: 'home', sectionKey: 'contributorsTeaser', items: [{ eyebrow: 'Comunidad', title: 'Top colaboradores', subtitle: 'Reputación basada en aportes validados, calidad y consistencia.', linkLabel: 'Ver todos', linkTo: '/contributors' }], updatedBy: 'seed' },
      { observatory: 'arrecifes', pageSlug: 'home', sectionKey: 'cta', items: [{ title: '¿Vives, buceas o investigas en la costa?', description: 'Sumate a la red. Aporta fotos, vuelos de dron, transectos o reportes de problemáticas. Un equipo revisa cada aporte y construyes tu reputación con cada validación.', primaryLabel: 'Contribuir', primaryTo: '/contribute', secondaryLabel: 'Cómo funciona', secondaryTo: '/about' }], updatedBy: 'seed' },

      // ── ABOUT ──
      { observatory: 'arrecifes', pageSlug: 'about', sectionKey: 'hero', items: [{ eyebrow: 'Sobre el observatorio', title: 'Una plataforma viva, abierta y verificada', subtitle: 'Herramienta de monitoreo y memoria de los arrecifes coralinos de México. Combina satélites, datos abiertos y el conocimiento de quienes habitan la costa.' }], updatedBy: 'seed' },
      { observatory: 'arrecifes', pageSlug: 'about', sectionKey: 'mission', items: [{ heading: '¿Por qué existe?', body: 'Los arrecifes coralinos mexicanos enfrentan presiones simultáneas: estrés térmico, blanqueamiento, sargazo, desarrollo costero, sobrepesca, derrames y enfermedades como SCTLD. La información existe pero está fragmentada entre dependencias, universidades y sensores satelitales. Este observatorio reúne esa información en un solo lugar y la pone al servicio de comunidades, tomadores de decisión y la ciudadanía.' }], updatedBy: 'seed' },
      { observatory: 'arrecifes', pageSlug: 'about', sectionKey: 'inspirations', items: [
        { title: 'Allen Coral Atlas', description: 'Mapas globales de hábitat bentónico a 5 m con monitoreo de blanqueamiento.' },
        { title: 'EJAtlas', description: 'Cartografía global de conflictos socioambientales con perspectiva de justicia ambiental.' },
        { title: 'NOAA Coral Reef Watch', description: 'Alertas operacionales de estrés térmico.' },
        { title: 'CONABIO Geoportal', description: 'Capas oficiales de México (ANP, arrecifes coralinos).' },
      ], updatedBy: 'seed' },
      { observatory: 'arrecifes', pageSlug: 'about', sectionKey: 'sources', items: [
        { title: 'Datos satelitales operacionales', description: 'NOAA CRW, NASA OB.DAAC, ESA Copernicus, USGS.' },
        { title: 'Bases académicas indexadas', description: 'Web of Science, Scopus, SciELO, Redalyc.' },
        { title: 'Fuentes institucionales mexicanas', description: 'CONANP, CONABIO, INEGI, SEMARNAT.' },
        { title: 'Aportes de la red', description: 'Validados por revisores con perfil verificado.' },
        { title: 'Prensa y comunicados', description: 'Solo como complemento, nunca como fuente primaria.' },
      ], updatedBy: 'seed' },
      { observatory: 'arrecifes', pageSlug: 'about', sectionKey: 'reputationIntro', items: [{ heading: 'Sistema de reputación', body: 'Inspirado en plataformas como Mercado Libre o Rappi: tu rango sube con cada aporte validado, ponderando calidad y consistencia, no solo volumen.' }], updatedBy: 'seed' },
      { observatory: 'arrecifes', pageSlug: 'about', sectionKey: 'validation', items: [
        { title: 'Envío con metadatos', description: 'El aporte se envía con metadatos (ubicación, fecha, tipo, adjuntos).' },
        { title: 'Evaluación', description: 'Un revisor con permiso review_submissions lo evalúa: ubicación coherente, metadata consistente, calidad técnica.' },
        { title: 'Calidad 0–100', description: 'El revisor asigna calidad 0–100 y publica/rechaza con notas.' },
        { title: 'Iteración', description: 'Si la rechaza, el autor puede corregir y reenviar.' },
        { title: 'Publicación', description: 'Una vez validado, el aporte aparece público con crédito y suma puntos al autor.' },
      ], updatedBy: 'seed' },
      { observatory: 'arrecifes', pageSlug: 'about', sectionKey: 'licenses', items: [{ heading: 'Licencias y atribución', body: 'Cada capa preserva su licencia original. Los datos NOAA y NASA son de dominio público; ESA Copernicus se redistribuye bajo Copernicus Open Data; Allen Coral Atlas y CONABIO requieren atribución (CC BY 4.0); Global Fishing Watch CC BY-NC 4.0. El código del observatorio se libera bajo Apache 2.0.' }], updatedBy: 'seed' },
      { observatory: 'arrecifes', pageSlug: 'about', sectionKey: 'contact', items: [{ heading: 'Contacto', body: 'Escríbenos para sumarte como institución, ONG, cooperativa pesquera o universidad. Los aportes individuales pasan por la página de contribuir.' }], updatedBy: 'seed' },

      // ── CONTRIBUTE ──
      { observatory: 'arrecifes', pageSlug: 'contribute', sectionKey: 'hero', items: [{ eyebrow: 'Contribuir', title: 'Aporta a la plataforma', subtitle: 'Comparte fotos submarinas, vuelos de dron, transectos, muestras o reportes de problemáticas costeras. Un equipo revisa cada aporte; al validarse construyes tu reputación.' }], updatedBy: 'seed' },
      { observatory: 'arrecifes', pageSlug: 'contribute', sectionKey: 'sidebar', items: [
        { title: '¿Por qué validamos?', body: 'Los datos que afectan políticas públicas y comunidades costeras requieren rigor. La validación protege a la red y a quienes consultan los datos.' },
        { title: 'Buenas prácticas', body: 'Incluye metadata de cámara/dron (EXIF). Documenta la metodología (transecto, profundidad). Evita imágenes con localización precisa de fauna sensible. Cita la fuente si es de un satélite (NASA, ESA, etc.).' },
        { title: 'Privacidad', body: 'Para reportes de conflictos puedes solicitar anonimato. Tu aporte se publica con la indicación "Anónimo verificado".' },
      ], updatedBy: 'seed' },
      { observatory: 'arrecifes', pageSlug: 'contribute', sectionKey: 'notice', items: [{ body: 'Tu aporte entrará en cola de revisión. Un revisor del equipo verifica metadatos, ubicación y calidad. Cuando se valida, tu reputación sube y el aporte aparece público con tu crédito.' }], updatedBy: 'seed' },

      // ── PÁGINAS HERO-ONLY ──
      { observatory: 'arrecifes', pageSlug: 'inventory', sectionKey: 'hero', items: [{ eyebrow: 'Inventario', title: 'Arrecifes monitoreados', subtitle: '{count} arrecifes coralinos documentados en el Pacífico, Golfo de México y Caribe mexicano. Datos consolidados de CONANP, CONABIO, Allen Coral Atlas y literatura académica.' }], updatedBy: 'seed' },
      { observatory: 'arrecifes', pageSlug: 'atlas', sectionKey: 'hero', items: [{ eyebrow: 'Atlas', title: 'Conflictos socioambientales costeros', subtitle: 'Inspirado en EJAtlas. Cada caso documenta quién impulsa la presión, quién resiste, qué arrecifes y comunidades se afectan. Evidencia abierta y verificable.' }], updatedBy: 'seed' },
      { observatory: 'arrecifes', pageSlug: 'data-sources', sectionKey: 'hero', items: [{ eyebrow: 'Capas y datos', title: 'Datos abiertos. Atribución obligatoria.', subtitle: 'Catálogo de capas satelitales y geoespaciales. Cada capa conserva su licencia y cita original. Descarga libre con crédito a la fuente.' }], updatedBy: 'seed' },
      { observatory: 'arrecifes', pageSlug: 'noticias', sectionKey: 'hero', items: [{ eyebrow: 'Editorial', title: 'Noticias del observatorio', subtitle: 'Análisis, recopilación de prensa y notas de campo sobre arrecifes mexicanos. Cada nota cita su fuente original.' }], updatedBy: 'seed' },
      { observatory: 'arrecifes', pageSlug: 'observations', sectionKey: 'hero', items: [{ eyebrow: 'Aportes de la red', title: 'Observaciones recientes', subtitle: 'Fotografías submarinas, vuelos de dron, transectos, muestreos y reportes ciudadanos. Cada aporte se etiqueta con su estado de validación y crédito al autor.' }], updatedBy: 'seed' },

      // ── CONTRIBUTORS ──
      { observatory: 'arrecifes', pageSlug: 'contributors', sectionKey: 'hero', items: [{ eyebrow: 'Red de colaboradores', title: 'Quienes alimentan la plataforma', subtitle: 'Pescadores, buzos, investigadoras, comunidades costeras. Sistema de reputación inspirado en marketplaces: tu rango sube con cada aporte validado.' }], updatedBy: 'seed' },
      { observatory: 'arrecifes', pageSlug: 'contributors', sectionKey: 'modesIntro', items: [{ eyebrow: 'Cinco maneras de aportar', title: '5 maneras de cuidar el mismo arrecife', subtitle: 'No es una escalera. Es una red horizontal: cada modo aporta saber distinto al monitoreo. Nadie reemplaza a nadie — se complementan.' }], updatedBy: 'seed' },
      { observatory: 'arrecifes', pageSlug: 'contributors', sectionKey: 'networkCallout', items: [{ heading: 'Red, no escalera', body: 'Los modos no son niveles que se escalan. Son maneras distintas de aportar al mismo objetivo: cuidar los arrecifes mexicanos. Tu modo se asigna automáticamente según tu trayectoria — y no hay un "modo mejor" que otro.' }], updatedBy: 'seed' },
      { observatory: 'arrecifes', pageSlug: 'contributors', sectionKey: 'cta', items: [{ title: '¿Quieres formar parte de la red?', description: 'Si vives, pescas, buceas o investigas en la costa mexicana, tu observación cuenta. Suma tu aporte y crece junto a la red.', primaryLabel: 'Cómo participar', primaryTo: '/contribute', secondaryLabel: 'Sobre el observatorio', secondaryTo: '/about' }], updatedBy: 'seed' },

      // ── FOOTER ──
      { observatory: 'arrecifes', pageSlug: 'footer', sectionKey: 'brand', items: [{ title: 'Observatorio de Arrecifes', subtitle: 'México · Vivo', description: 'Plataforma viva de monitoreo de arrecifes coralinos de México. Datos satelitales abiertos de NASA, NOAA, ESA Copernicus y CONABIO. Conocimiento ciudadano y científico validado.' }], updatedBy: 'seed' },
      { observatory: 'arrecifes', pageSlug: 'footer', sectionKey: 'attribution', items: [{ eyebrow: 'Atribución obligatoria', body: 'Todas las capas descargables conservan su licencia y atribución original. Ver la sección de capas y datos para citas.' }], updatedBy: 'seed' },
      { observatory: 'arrecifes', pageSlug: 'footer', sectionKey: 'sources', items: [
        { label: 'NOAA Coral Reef Watch', href: 'https://coralreefwatch.noaa.gov' },
        { label: 'NASA OB.DAAC', href: 'https://oceancolor.gsfc.nasa.gov' },
        { label: 'ESA Copernicus', href: 'https://dataspace.copernicus.eu' },
        { label: 'CONABIO Geoportal', href: 'http://geoportal.conabio.gob.mx' },
        { label: 'Allen Coral Atlas', href: 'https://allencoralatlas.org' },
      ], updatedBy: 'seed' },
      { observatory: 'arrecifes', pageSlug: 'footer', sectionKey: 'quickLinks', items: [
        { label: 'Mapa vivo', to: '/livemap' },
        { label: 'Arrecifes', to: '/inventory' },
        { label: 'Atlas de conflictos', to: '/atlas' },
        { label: 'Capas y datos abiertos', to: '/data-sources' },
        { label: 'Comunidad', to: '/contributors' },
        { label: 'Observaciones recientes', to: '/observations' },
        { label: 'Contribuir', to: '/contribute' },
        { label: 'Sobre el observatorio', to: '/about' },
      ], updatedBy: 'seed' },
      { observatory: 'arrecifes', pageSlug: 'footer', sectionKey: 'institutional', items: [{ body: 'Iniciativa del CIIEMAD — Centro Interdisciplinario de Investigaciones y Estudios sobre Medio Ambiente y Desarrollo, Instituto Politécnico Nacional.', copyright: '© 2026 Observatorio de Arrecifes — México. Plataforma de datos abiertos. Licencia de software Apache 2.0.' }], updatedBy: 'seed' },
    ]));
    console.log('  ObsCmsSection (arrecifes): 30 records created');
  }

  // ── CMS Sections (techos-verdes) ──
  // Migra el copy editorial al CMS para que /admin/contenido lo edite. Los
  // defaults espejados viven en
  // `observatorio-techos-verdes/data/cms-defaults.ts`.
  const techosCmsCount = await cmsRepo.count({ where: { observatory: 'techos-verdes' } });
  if (techosCmsCount === 0) {
    await cmsRepo.save(cmsRepo.create([
      // ── HOME ──
      { observatory: 'techos-verdes', pageSlug: 'home', sectionKey: 'hero', items: [{ eyebrow: 'CDMX · Infraestructura verde urbana', titleLine1: 'Observatorio de', titleLine2: 'Techos Verdes', subtitle: 'Inventario, priorización y validación de techos verdes en la Ciudad de México. Combina detección satelital, análisis multicriterio (AHP) e inteligencia artificial para identificar las mejores azoteas candidatas.', primaryLabel: 'Explorar el inventario', primaryTo: '/inventario', secondaryLabel: 'Ver metodología', secondaryTo: '/metodologia' }], updatedBy: 'seed' },
      { observatory: 'techos-verdes', pageSlug: 'home', sectionKey: 'features', items: [
        { icon: 'lucide:map', title: 'Mapa interactivo', description: 'Visualiza techos verdes existentes y candidatos priorizados sobre la cartografía CDMX. Filtra por alcaldía, tipo y nivel de aptitud.', linkLabel: 'Abrir mapa', linkTo: '/mapa', accent: 'primary' },
        { icon: 'lucide:building-2', title: 'Catálogo de inventario', description: 'Más de 50 techos verdes documentados con superficie, tipo, vegetación, nivel de uso y servicios ecosistémicos provistos.', linkLabel: 'Ver inventario', linkTo: '/inventario', accent: 'eco' },
        { icon: 'lucide:sparkles', title: 'Validación con IA', description: 'Cada candidato se analiza con Google Gemini Vision para confirmar aptitud, materiales y obstrucciones desde imagen aérea.', linkLabel: 'Ver validaciones', linkTo: '/ia-validacion', accent: 'secondary' },
      ], updatedBy: 'seed' },
      { observatory: 'techos-verdes', pageSlug: 'home', sectionKey: 'cta', items: [{ title: '¿Tu edificio podría tener un techo verde?', description: 'Consulta el catálogo de candidatos priorizados o revisa la metodología AHP para entender cómo evaluamos cada azotea.', primaryLabel: 'Ver candidatos', primaryTo: '/candidatos', secondaryLabel: 'Sobre el observatorio', secondaryTo: '/sobre' }], updatedBy: 'seed' },

      // ── SOBRE ──
      { observatory: 'techos-verdes', pageSlug: 'sobre', sectionKey: 'hero', items: [{ eyebrow: 'Sobre el observatorio', title: 'Observatorio de Techos Verdes CDMX', subtitle: 'Iniciativa académica del CIIEMAD-IPN que sistematiza el potencial de techos verdes en la Ciudad de México como infraestructura verde urbana.' }], updatedBy: 'seed' },
      { observatory: 'techos-verdes', pageSlug: 'sobre', sectionKey: 'mission', items: [{ heading: '¿Por qué un observatorio?', body: 'La CDMX enfrenta isla de calor urbano, inundaciones por escurrimiento, mala calidad del aire y déficit de áreas verdes. Los techos verdes mitigan los cuatro — pero requieren priorizar dónde son técnicamente viables. Este observatorio combina datos OpenStreetMap, análisis multicriterio AHP e IA visual para mapear sistemáticamente el potencial.' }], updatedBy: 'seed' },
      { observatory: 'techos-verdes', pageSlug: 'sobre', sectionKey: 'objetivos', items: [
        { title: 'Detectar', description: 'Identificar azoteas planas con potencial técnico vía OSM (área, rectangularidad, número de niveles).' },
        { title: 'Priorizar', description: 'Calcular score AHP sobre 8 criterios para identificar los candidatos óptimos.' },
        { title: 'Validar', description: 'Confirmar aptitud con análisis IA (Gemini Vision) sobre la imagen aérea de cada candidato.' },
        { title: 'Documentar', description: 'Mantener inventario público de techos verdes existentes con su tipología y servicios ecosistémicos.' },
      ], updatedBy: 'seed' },

      // ── METODOLOGÍA ──
      { observatory: 'techos-verdes', pageSlug: 'metodologia', sectionKey: 'hero', items: [{ eyebrow: 'Metodología AHP', title: 'Cómo priorizamos los candidatos', subtitle: 'Analytic Hierarchy Process (Saaty) sobre 8 criterios técnicos: área, rectangularidad, niveles, material, pendiente, obstrucciones, accesibilidad y carga estructural.' }], updatedBy: 'seed' },
      { observatory: 'techos-verdes', pageSlug: 'metodologia', sectionKey: 'pasos', items: [
        { title: 'Detección OSM', description: 'Query Overpass por edificios planos en cada alcaldía CDMX (filtros: building, area > 200m², geom rectangular).' },
        { title: 'Cálculo AHP', description: 'Normalización 0-1 de los 8 criterios → ponderación por matriz de pesos → score 0-100.' },
        { title: 'Validación IA', description: 'Imagen aérea del candidato → Gemini 2.0 Flash → clasificación (techo plano sí/no, materiales, obstrucciones).' },
        { title: 'Revisión humana', description: 'Casos de baja confianza IA pasan a revisión manual por el equipo.' },
      ], updatedBy: 'seed' },

      // ── PÁGINAS HERO-ONLY ──
      { observatory: 'techos-verdes', pageSlug: 'indicadores', sectionKey: 'hero', items: [{ eyebrow: 'Indicadores', title: 'Estado actual del observatorio', subtitle: 'Métricas territoriales, distribución AHP, servicios ecosistémicos cuantificados y dinámicas temporales del inventario CDMX.' }], updatedBy: 'seed' },
      { observatory: 'techos-verdes', pageSlug: 'inventario', sectionKey: 'hero', items: [{ eyebrow: 'Inventario', title: 'Techos verdes documentados', subtitle: '{count} techos verdes registrados en la Ciudad de México con su tipología, vegetación y servicios ecosistémicos.' }], updatedBy: 'seed' },
      { observatory: 'techos-verdes', pageSlug: 'candidatos', sectionKey: 'hero', items: [{ eyebrow: 'Candidatos', title: 'Azoteas priorizadas para techo verde', subtitle: 'Sitios detectados via OpenStreetMap y aprobados como aptos. Ordenados por score AHP — los de mayor puntaje son los mejores candidatos para visita técnica.' }], updatedBy: 'seed' },
      { observatory: 'techos-verdes', pageSlug: 'mapa', sectionKey: 'hero', items: [{ eyebrow: 'Mapa interactivo', title: 'Cartografía de techos verdes', subtitle: 'Capas de techos existentes, candidatos priorizados y aptitud por alcaldía sobre OpenStreetMap. Filtros por tipo, score AHP y estado.' }], updatedBy: 'seed' },
      { observatory: 'techos-verdes', pageSlug: 'aptitud', sectionKey: 'hero', items: [{ eyebrow: 'Aptitud territorial', title: 'Mapa de aptitud para techos verdes', subtitle: 'Capa raster generada con AHP sobre toda la CDMX: zonas verdes son alta aptitud (≥80), amarillo media (60-79), naranja baja (<60).' }], updatedBy: 'seed' },
      { observatory: 'techos-verdes', pageSlug: 'ia-validacion', sectionKey: 'hero', items: [{ eyebrow: 'IA · Validación visual', title: 'Análisis automatizado con Gemini', subtitle: 'Cada candidato pasa por Gemini 2.0 Flash que evalúa la imagen aérea y devuelve aptitud, materiales, obstrucciones y tipo recomendado.' }], updatedBy: 'seed' },

      // ── FOOTER ──
      { observatory: 'techos-verdes', pageSlug: 'footer', sectionKey: 'brand', items: [{ title: 'Observatorio de Techos Verdes', subtitle: 'CDMX', description: 'Inventario, priorización y validación de techos verdes en la Ciudad de México. Iniciativa CIIEMAD — Instituto Politécnico Nacional.' }], updatedBy: 'seed' },
      { observatory: 'techos-verdes', pageSlug: 'footer', sectionKey: 'sources', items: [
        { label: 'OpenStreetMap (Overpass API)', href: 'https://overpass-api.de' },
        { label: 'Google Earth Engine', href: 'https://earthengine.google.com' },
        { label: 'CONABIO', href: 'http://geoportal.conabio.gob.mx' },
        { label: 'Sentinel Hub EO Browser', href: 'https://www.sentinel-hub.com/explore/eobrowser/' },
      ], updatedBy: 'seed' },
      { observatory: 'techos-verdes', pageSlug: 'footer', sectionKey: 'quickLinks', items: [
        { label: 'Mapa', to: '/mapa' },
        { label: 'Inventario', to: '/inventario' },
        { label: 'Candidatos', to: '/candidatos' },
        { label: 'Aptitud territorial', to: '/aptitud' },
        { label: 'Validación IA', to: '/ia-validacion' },
        { label: 'Indicadores', to: '/indicadores' },
        { label: 'Metodología', to: '/metodologia' },
        { label: 'Sobre', to: '/sobre' },
      ], updatedBy: 'seed' },
      { observatory: 'techos-verdes', pageSlug: 'footer', sectionKey: 'institutional', items: [{ body: 'Iniciativa del CIIEMAD — Centro Interdisciplinario de Investigaciones y Estudios sobre Medio Ambiente y Desarrollo, Instituto Politécnico Nacional.', copyright: '© 2026 Observatorio de Techos Verdes CDMX. Plataforma de datos abiertos. Licencia de software Apache 2.0.' }], updatedBy: 'seed' },
    ]));
    console.log('  ObsCmsSection (techos-verdes): 18 records created');
  }

  // ── Prospect Submissions ──
  const prospectRepo = AppDataSource.getRepository(ProspectSubmission);
  if ((await prospectRepo.count()) === 0) {
    await prospectRepo.save(prospectRepo.create([
      {
        observatory: 'humedales',
        status: ProspectStatus.PENDIENTE,
        data: {
          nombre: 'Parque Ecologico Cuicuilco',
          alcaldia: 'Tlalpan',
          lat: 19.3020,
          lng: -99.1805,
          superficie: 5000,
          tipoHumedal: 'ha_fws',
          funcionPrincipal: 'Captacion pluvial aprovechando escorrentia del cerro',
        },
        source: ProspectSource.MANUAL,
        confianzaDetector: null,
        notasAdmin: null,
        reviewedBy: null,
        reviewedAt: null,
      },
    ]));
    console.log('  ProspectSubmission: 1 record created');
  }

  // ── Humedales Tiers (modos de participacion) ──
  const humedalTierRepo = AppDataSource.getRepository(ObsHumedalTier);
  if ((await humedalTierRepo.count()) === 0) {
    await humedalTierRepo.save(humedalTierRepo.create([
      {
        slug: 'aprendiz',
        label: 'Aprendiz',
        description: 'Primera entrada al observatorio. Reporta un humedal observado, comparte una foto o aporta una pista de campo.',
        minScore: 0, maxScore: 19,
        color: 'slate', icon: 'lucide:seedling', sortOrder: 1,
        modeTitle: 'Curiosidad ciudadana',
        audience: 'Vecinas, vecinos y estudiantes que pasan por el sitio.',
        contributions: [
          'Reportar un humedal candidato via /registra',
          'Compartir foto y ubicacion aproximada',
          'Avisar de cambios visibles (sequia, basura, especies invasoras)',
        ],
        bridge: 'Cuando dos reportes son validados pasa a Observador.',
        visible: true, archived: false,
      },
      {
        slug: 'observador',
        label: 'Observador',
        description: 'Sigue uno o varios humedales en el tiempo. Sus aportes ya tienen referencia (fecha, lugar exacto) y han sido validados al menos dos veces.',
        minScore: 20, maxScore: 99,
        color: 'secondary', icon: 'lucide:eye', sortOrder: 2,
        modeTitle: 'Observacion sostenida',
        audience: 'Personas que viven cerca de un humedal o lo visitan periodicamente.',
        contributions: [
          'Series de fotos del mismo sitio cada 1-3 meses',
          'Notas de fauna observada (aves, anfibios)',
          'Reporte de obras o intervenciones cercanas',
        ],
        bridge: 'Si comparte datos cuantitativos (mediciones de campo) escala a Caracterizador.',
        visible: true, archived: false,
      },
      {
        slug: 'caracterizador',
        label: 'Caracterizador',
        description: 'Aporta datos tecnicos verificables: superficie, vegetacion identificada, mediciones simples (pH, conductividad), planos basicos.',
        minScore: 100, maxScore: 299,
        color: 'eco', icon: 'lucide:ruler', sortOrder: 3,
        modeTitle: 'Caracterizacion tecnica',
        audience: 'Estudiantes de licenciatura/maestria, tecnicos ambientales, ONGs locales.',
        contributions: [
          'Identificacion de vegetacion (Typha, Phragmites, Schoenoplectus, etc.)',
          'Mediciones de superficie y volumen',
          'Calidad de agua basica (turbidez, OD, pH)',
        ],
        bridge: 'Si publica datos en revista o tesis, pasa a Especialista.',
        visible: true, archived: false,
      },
      {
        slug: 'especialista',
        label: 'Especialista',
        description: 'Investigador con publicaciones, tesis o proyectos formales sobre humedales. Sus aportes son citables y suelen incluir fuentes academicas.',
        minScore: 300, maxScore: 999,
        color: 'primary', icon: 'lucide:microscope', sortOrder: 4,
        modeTitle: 'Investigacion cientifica',
        audience: 'Academia (UNAM, IPN, UAM, UAEMex, UAEMor, IMTA, etc.) y consultoras tecnicas.',
        contributions: [
          'Resultados de monitoreo formal (NOM-001, NOM-003)',
          'Publicaciones revisadas por pares',
          'Diseno o evaluacion de humedales',
        ],
        bridge: 'Cuando coordina equipos o sostiene un sitio en el tiempo, asume rol de Custodio.',
        visible: true, archived: false,
      },
      {
        slug: 'custodio',
        label: 'Custodio',
        description: 'Institucion u organizacion que opera y resguarda un humedal en el largo plazo. Asegura datos historicos, mantenimiento y formacion.',
        minScore: 1000, maxScore: null,
        color: 'accent', icon: 'lucide:shield-check', sortOrder: 5,
        modeTitle: 'Custodia institucional',
        audience: 'Universidades, dependencias gubernamentales (SEDEMA, SACMEX), ONGs grandes y operadores publicos.',
        contributions: [
          'Operacion y mantenimiento del humedal',
          'Series temporales de calidad de agua',
          'Formacion de cuadros y replicas en otros sitios',
        ],
        bridge: 'Es el extremo del modelo: integra los aportes de los otros modos en politica publica.',
        visible: true, archived: false,
      },
    ]));
    console.log('  ObsHumedalTier: 5 records created');
  }

  // ── Humedales Contributors (semilla minima para demostrar atribucion) ──
  const humedalContribRepo = AppDataSource.getRepository(ObsHumedalContributor);
  if ((await humedalContribRepo.count()) === 0) {
    await humedalContribRepo.save(humedalContribRepo.create([
      {
        displayName: 'Equipo CIIEMAD-IPN',
        handle: 'ciiemad-ipn',
        role: 'institucion',
        affiliation: 'CIIEMAD - Instituto Politecnico Nacional',
        bio: 'Centro Interdisciplinario de Investigaciones y Estudios sobre Medio Ambiente y Desarrollo, IPN. Coordina el inventario Fase 1 y la investigacion sobre humedales artificiales en CDMX.',
        alcaldia: 'Gustavo A. Madero',
        joinedAt: '2024-01-15',
        tier: 'custodio',
        reputationScore: 1500, validatedContributions: 150, rejectedContributions: 0,
        acceptanceRate: 1.0, averageQuality: 95, consecutiveMonthsActive: 24,
        publicProfile: true, verified: true, visible: true, archived: false,
      },
      {
        displayName: 'Diego Dominguez Solis',
        handle: 'diego-dominguez',
        role: 'investigador',
        affiliation: 'CIIEMAD-IPN',
        bio: 'M. en C. autor del Inventario Fase 1 de humedales artificiales en CDMX y de la revision sistematica Water (2025).',
        alcaldia: 'Gustavo A. Madero',
        joinedAt: '2024-06-01',
        tier: 'especialista',
        reputationScore: 850, validatedContributions: 85, rejectedContributions: 0,
        acceptanceRate: 1.0, averageQuality: 95, consecutiveMonthsActive: 18,
        publicProfile: true, verified: true, visible: true, archived: false,
      },
      {
        displayName: 'GAIA - Facultad de Quimica UNAM',
        handle: 'gaia-fq-unam',
        role: 'institucion',
        affiliation: 'Facultad de Quimica, UNAM',
        bio: 'Grupo de Investigacion en Ingenieria Ambiental Aplicada. 30+ anios investigando humedales artificiales (STHA Aragon, SHATTO, multiples instalaciones UNAM).',
        alcaldia: 'Coyoacan',
        joinedAt: '2024-01-15',
        tier: 'custodio',
        reputationScore: 1700, validatedContributions: 170, rejectedContributions: 0,
        acceptanceRate: 1.0, averageQuality: 96, consecutiveMonthsActive: 24,
        publicProfile: true, verified: true, visible: true, archived: false,
      },
    ]));
    console.log('  ObsHumedalContributor: 3 records created');
  }

  // ── Techos Verdes Tiers (modos de participacion) ──
  const tvTierRepo = AppDataSource.getRepository(ObsTechosVerdesTier);
  if ((await tvTierRepo.count()) === 0) {
    await tvTierRepo.save(tvTierRepo.create([
      {
        slug: 'aprendiz',
        label: 'Aprendiz',
        description: 'Primera entrada al observatorio. Reporta una azotea observada o sugiere un sitio candidato.',
        minScore: 0, maxScore: 19,
        color: 'slate', icon: 'lucide:seedling', sortOrder: 1,
        modeTitle: 'Curiosidad ciudadana',
        audience: 'Vecinas, vecinos, peatones que ven una azotea con potencial.',
        contributions: [
          'Reportar una azotea candidata via /registra',
          'Compartir foto y direccion aproximada',
          'Avisar de modificaciones visibles (nuevo techo verde, retiro de obstrucciones)',
        ],
        bridge: 'Cuando dos reportes son validados pasa a Reportador.',
        visible: true, archived: false,
      },
      {
        slug: 'reportador',
        label: 'Reportador',
        description: 'Da seguimiento a una o varias azoteas en el tiempo. Sus aportes ya tienen referencia exacta y han sido validados al menos dos veces.',
        minScore: 20, maxScore: 99,
        color: 'secondary', icon: 'lucide:eye', sortOrder: 2,
        modeTitle: 'Observacion sostenida',
        audience: 'Personas que viven o trabajan cerca de techos verdes y los visitan periodicamente.',
        contributions: [
          'Series de fotos del mismo techo cada 3-6 meses',
          'Notas de mantenimiento o estado vegetativo',
          'Reporte de obras o intervenciones cercanas',
        ],
        bridge: 'Si comparte mediciones tecnicas (area, pendiente, sustrato) escala a Caracterizador.',
        visible: true, archived: false,
      },
      {
        slug: 'caracterizador',
        label: 'Caracterizador',
        description: 'Aporta datos tecnicos: superficie, pendiente, tipo de techo (extensivo / semi-intensivo / intensivo), sustrato, vegetacion identificada.',
        minScore: 100, maxScore: 299,
        color: 'eco', icon: 'lucide:ruler', sortOrder: 3,
        modeTitle: 'Caracterizacion tecnica',
        audience: 'Estudiantes de arquitectura/ingenieria, tecnicos urbanos, ONGs locales.',
        contributions: [
          'Mediciones de superficie y pendiente',
          'Identificacion de tipo de techo verde y sustrato',
          'Levantamiento de vegetacion',
        ],
        bridge: 'Si publica datos en revista o tesis, pasa a Especialista.',
        visible: true, archived: false,
      },
      {
        slug: 'especialista',
        label: 'Especialista',
        description: 'Profesional con publicaciones, tesis o proyectos formales sobre techos verdes. Sus aportes son citables y suelen incluir fuentes.',
        minScore: 300, maxScore: 999,
        color: 'primary', icon: 'lucide:microscope', sortOrder: 4,
        modeTitle: 'Diseno e investigacion',
        audience: 'Arquitectos, ingenieros estructurales, academia (UNAM, IPN, UAM) y consultoras.',
        contributions: [
          'Diseno y memoria de calculo de techos verdes',
          'Publicaciones y casos de estudio',
          'Auditoria estructural y de aptitud',
        ],
        bridge: 'Cuando coordina equipos o sostiene un sitio en operacion, asume rol de Operador.',
        visible: true, archived: false,
      },
      {
        slug: 'operador',
        label: 'Operador',
        description: 'Empresa, gobierno o institucion que instala y mantiene techos verdes en operacion. Asegura datos historicos y replicas.',
        minScore: 1000, maxScore: null,
        color: 'accent', icon: 'lucide:shield-check', sortOrder: 5,
        modeTitle: 'Operacion institucional',
        audience: 'Empresas constructoras, dependencias gubernamentales (SEDEMA), ONGs grandes y operadores publicos.',
        contributions: [
          'Instalacion y mantenimiento de techos verdes',
          'Series de monitoreo (temperatura, humedad, escurrimiento)',
          'Formacion de cuadros y replica en otros edificios',
        ],
        bridge: 'Es el extremo del modelo: integra los aportes de los otros modos en politica publica.',
        visible: true, archived: false,
      },
    ]));
    console.log('  ObsTechosVerdesTier: 5 records created');
  }

  // ── Techos Verdes Contributors (semilla minima) ──
  const tvContribRepo = AppDataSource.getRepository(ObsTechosVerdesContributor);
  if ((await tvContribRepo.count()) === 0) {
    await tvContribRepo.save(tvContribRepo.create([
      {
        displayName: 'CIIEMAD-IPN',
        handle: 'ciiemad-ipn-techos',
        role: 'academia',
        affiliation: 'CIIEMAD - Instituto Politecnico Nacional',
        bio: 'Centro Interdisciplinario de Investigaciones y Estudios sobre Medio Ambiente y Desarrollo, IPN. Coordina el inventario de techos verdes en CDMX.',
        alcaldia: 'Gustavo A. Madero',
        joinedAt: '2024-01-15',
        tier: 'operador',
        reputationScore: 1500, validatedContributions: 150, rejectedContributions: 0,
        acceptanceRate: 1.0, averageQuality: 95, consecutiveMonthsActive: 24,
        publicProfile: true, verified: true, visible: true, archived: false,
      },
      {
        displayName: 'Equipo SEDEMA',
        handle: 'sedema-cdmx',
        role: 'gobierno',
        affiliation: 'Secretaria del Medio Ambiente, Gobierno de la CDMX',
        bio: 'SEDEMA opera el programa de azoteas verdes y naturadas de la Ciudad de Mexico. Provee datos de inventario y normativa.',
        alcaldia: 'Cuauhtemoc',
        joinedAt: '2024-01-20',
        tier: 'operador',
        reputationScore: 1200, validatedContributions: 120, rejectedContributions: 0,
        acceptanceRate: 1.0, averageQuality: 92, consecutiveMonthsActive: 24,
        publicProfile: true, verified: true, visible: true, archived: false,
      },
    ]));
    console.log('  ObsTechosVerdesContributor: 2 records created');
  }

  console.log('Observatory content seed complete');
}
