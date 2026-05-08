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
    await cmsRepo.save(cmsRepo.create([
      {
        observatory: 'humedales',
        pageSlug: 'home',
        sectionKey: 'features',
        items: [
          { title: 'Inventario geoespacial', description: 'Localizacion y caracterizacion de humedales artificiales en la Ciudad de Mexico.', to: '/inventario', bg: 'bg-primary-50', iconColor: 'text-primary', icon: 'lucide:map-pin' },
          { title: 'Servicios ecosistemicos', description: 'Analisis de beneficios ambientales: tratamiento de agua, habitat para fauna, captura de carbono.', to: '/analisis/indicadores', bg: 'bg-eco/10', iconColor: 'text-eco', icon: 'lucide:droplets' },
          { title: 'Metodologia cientifica', description: 'Sistematizacion basada en criterios tecnicos: clasificacion del HA por sistema de flujo (FWS, SFS).', to: '/sobre#metodologia', bg: 'bg-secondary/10', iconColor: 'text-secondary', icon: 'lucide:microscope' },
        ],
        updatedBy: 'seed',
      },
      {
        observatory: 'humedales',
        pageSlug: 'home',
        sectionKey: 'tipologias',
        items: [
          { title: 'HA flujo superficial (FWS)', description: 'El agua fluye visiblemente sobre el sustrato, similar a un humedal natural.', examples: 'Anfibium, Playa de Aves, Vivero Tlaxialtemalco, Cerro de la Estrella', badge: 'FWS', badgeClass: 'badge-secondary' },
          { title: 'HA flujo subsuperficial (SFS)', description: 'El agua fluye a traves del sustrato sin ser visible en la superficie.', examples: 'Parque Ecologico Cuitlahuac, Segundo Aragon, CIBAC Cuemanco', badge: 'HSSF', badgeClass: 'badge-primary' },
          { title: 'HA hibrido (FWS + SFS)', description: 'Combina modulos de flujo superficial y subsuperficial en serie.', examples: 'Aragon STHA (HAFSS + HAFS)', badge: 'Hibrido', badgeClass: 'badge-eco' },
        ],
        updatedBy: 'seed',
      },
      {
        observatory: 'humedales',
        pageSlug: 'sobre',
        sectionKey: 'criterios',
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
    ]));
    console.log('  ObsCmsSection (humedales): 3 records created');
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

  console.log('Observatory content seed complete');
}
