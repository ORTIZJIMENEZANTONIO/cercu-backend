import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Siembra las secciones de CMS adicionales del observatorio de techos verdes
 * que se introdujeron tras la reorganización IA (Fases 1-4 + sweep editorial):
 *
 *   - home.audienceGate (4 puertas)        home.academicHighlight (banner Q1)
 *   - aprende.*  (hero, intro, capas, tipologias, beneficios,
 *                 casoIntro, casoCiiemad, galeria, cta)
 *   - investigacion.* (hero, marco, equipo, publicaciones, metodologia,
 *                       pesosAhp, datos, documentos, citar)
 *   - agenda-2030.ods   (7 ODS conectados)
 *   - agenda-2030.datos (6 stats académicos)
 *   - indicadores.kpis  (8 KPI cards del header)
 *   - metodologia.pasos (shape extendido con number+icono+color+details)
 *
 * Patrón:
 *   - upsertIfMissing: INSERT si la fila no existe (preserva ediciones).
 *   - upsertReshape:   UPDATE si la fila existe pero el primer item no tiene
 *                      el campo esperado (= versión vieja con shape obsoleto),
 *                      caso típico de metodologia.pasos (antes title+description,
 *                      ahora number+title+description+icono+color+details[]).
 *
 * Espejo de los defaults definidos en
 *   observatorio-techos-verdes/data/cms-defaults.ts
 */
export class SeedTechosVerdesExtendedCms1742000000000
  implements MigrationInterface
{
  name = 'SeedTechosVerdesExtendedCms1742000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const OBS = 'techos-verdes';
    const updatedBy = 'migration:1742';

    const insertIfMissing = async (
      pageSlug: string,
      sectionKey: string,
      items: unknown[],
    ) => {
      const existing = await queryRunner.query(
        `SELECT id FROM obs_cms_sections WHERE observatory = ? AND pageSlug = ? AND sectionKey = ? LIMIT 1`,
        [OBS, pageSlug, sectionKey],
      );
      if (existing.length === 0) {
        await queryRunner.query(
          `INSERT INTO obs_cms_sections (observatory, pageSlug, sectionKey, items, updatedBy) VALUES (?, ?, ?, ?, ?)`,
          [OBS, pageSlug, sectionKey, JSON.stringify(items), updatedBy],
        );
      }
    };

    // Reescribe solo si la versión existente NO tiene el campo `requiredField`
    // en su primer item (heurística de "shape antiguo").
    const upsertIfStaleShape = async (
      pageSlug: string,
      sectionKey: string,
      items: unknown[],
      requiredField: string,
    ) => {
      const existing = await queryRunner.query(
        `SELECT id, items FROM obs_cms_sections WHERE observatory = ? AND pageSlug = ? AND sectionKey = ? LIMIT 1`,
        [OBS, pageSlug, sectionKey],
      );
      if (existing.length === 0) {
        await queryRunner.query(
          `INSERT INTO obs_cms_sections (observatory, pageSlug, sectionKey, items, updatedBy) VALUES (?, ?, ?, ?, ?)`,
          [OBS, pageSlug, sectionKey, JSON.stringify(items), updatedBy],
        );
        return;
      }
      const row = existing[0];
      let parsed: unknown[] = [];
      try {
        parsed = typeof row.items === 'string' ? JSON.parse(row.items) : row.items;
      } catch {
        parsed = [];
      }
      const first = (parsed[0] || {}) as Record<string, unknown>;
      if (!(requiredField in first)) {
        await queryRunner.query(
          `UPDATE obs_cms_sections SET items = ?, updatedBy = ? WHERE id = ?`,
          [JSON.stringify(items), updatedBy, row.id],
        );
      }
    };

    // ─────────────── home — audienceGate + academicHighlight ───────────────
    await insertIfMissing('home', 'audienceGate', [
      { tag: 'Aprender', title: 'Aprende', description: 'Empieza por lo esencial: qué es un techo verde, cómo se construye y por qué cambia el lugar donde vives.', to: '/aprende', ctaLabel: 'Comenzar', icono: 'book', color: 'eco' },
      { tag: 'Investigar', title: 'Investigación', description: 'Marco CIIEMAD-IPN, publicaciones Q1, metodología AHP y descarga de datos.', to: '/investigacion', ctaLabel: 'Ver publicaciones', icono: 'ai', color: 'primary' },
      { tag: 'Explorar', title: 'Explora los datos', description: 'Mapa, inventario de 57 techos, candidatos priorizados e indicadores ambientales.', to: '/mapa', ctaLabel: 'Abrir mapa', icono: 'map', color: 'secondary' },
      { tag: 'Participar', title: 'Comunidad', description: 'Suma un techo, contribuye con caracterización técnica o únete como especialista.', to: '/comunidad', ctaLabel: 'Aportar', icono: 'community', color: 'accent' },
    ]);
    await insertIfMissing('home', 'academicHighlight', [
      {
        tag: 'Publicación destacada',
        venue: 'Sustainable Cities and Society — Elsevier (Q1)',
        anio: '2025',
        autores: 'Cervantes-Nájera, A. L., Martínez Rodríguez, M. C., et al.',
        titulo: 'Spatial suitability analysis for the implementation of green rooftops in highly urbanized Mexico City',
        descripcion: 'Análisis multicriterio AHP de 8 variables sobre toda la CDMX. Identifica 428 km² prioritarios y 514,000 m² de potencial real. Es el sustento metodológico de este observatorio.',
        doi: '10.1016/j.scs.2025.S2210670725006547',
        kpi1Value: '428', kpi1Label: 'km² zonas prioritarias',
        kpi2Value: '514,000', kpi2Label: 'm² potencial CDMX',
        kpi3Value: 'Q1', kpi3Label: 'Elsevier · SCS 2025',
        ctaLabel: 'Ver marco académico', ctaTo: '/investigacion#publicaciones',
      },
    ]);

    // ─────────────── aprende ───────────────
    await insertIfMissing('aprende', 'hero', [
      { eyebrow: 'Aprende', title: 'Conoce los techos verdes', subtitle: 'Te invitamos a un recorrido breve por una de las soluciones más bonitas para nuestra ciudad: qué son, cómo se construyen, qué tipos existen y por qué cambian la vida de quienes los habitan.' },
    ]);
    await insertIfMissing('aprende', 'intro', [
      { title: '¿Qué es un techo verde?', subtitle: 'Un sistema constructivo que sustituye la grava o la impermeabilización expuesta por una cubierta vegetal viva sobre las azoteas.', tag: 'Fundamento',
        paragraph1: 'No es jardinería en macetas: es una capa funcional integrada al edificio que aporta servicios ambientales medibles —regulación térmica, captación pluvial, captura de CO₂ y hábitat para polinizadores— sin demandar más suelo en una ciudad ya saturada de cemento.',
        paragraph2: 'En la CDMX, donde el 75 % del territorio urbano carece de áreas verdes accesibles a 400 m caminando, las azoteas representan la reserva de suelo vegetal más subutilizada: 514,000 m² potenciales según el análisis territorial del CIIEMAD-IPN.' },
    ]);
    await insertIfMissing('aprende', 'capas', [
      { num: 1, nombre: 'Vegetación', funcion: 'Capa viva. Suculentas, gramíneas o cubresuelos según la tipología.', color: 'eco' },
      { num: 2, nombre: 'Sustrato de crecimiento', funcion: 'Mezcla ligera de origen mineral con materia orgánica. Define el peso.', color: 'accent' },
      { num: 3, nombre: 'Filtro / geotextil', funcion: 'Evita que partículas finas obstruyan el drenaje.', color: 'teal' },
      { num: 4, nombre: 'Capa drenante', funcion: 'Conduce el exceso de agua y reserva humedad. En TVLE: paja + fibra de coco.', color: 'indigo' },
      { num: 5, nombre: 'Barrera antirraíces', funcion: 'Protege la membrana de la penetración mecánica de las raíces.', color: 'rose' },
      { num: 6, nombre: 'Impermeabilizante y losa', funcion: 'Estructura existente. Debe soportar carga mínima de 100 kg/m² (NTC-CDMX 2017).', color: 'primary' },
    ]);
    await insertIfMissing('aprende', 'tipologias', [
      { slug: 'extensivo', nombre: 'Extensivo (TVLE)', pesoSaturado: '60 – 150 kg/m²', sustrato: '5 – 15 cm', vegetacion: 'Suculentas, sedum, gramíneas resistentes', mantenimiento: 'Bajo: 1 – 2 visitas/año', uso: 'Mayoría de azoteas existentes en CDMX. Es la tipología que la investigación CIIEMAD recomienda para retrofit masivo.', color: 'eco', icono: 'leaf' },
      { slug: 'semi-intensivo', nombre: 'Semi-intensivo', pesoSaturado: '150 – 250 kg/m²', sustrato: '15 – 25 cm', vegetacion: 'Cubresuelos, herbáceas, arbustos pequeños', mantenimiento: 'Medio: 4 – 6 visitas/año, riego ocasional', uso: 'Edificaciones con capacidad estructural confirmada por dictamen.', color: 'secondary', icono: 'water' },
      { slug: 'intensivo', nombre: 'Intensivo', pesoSaturado: '250 – 750 kg/m²', sustrato: '> 25 cm', vegetacion: 'Arbustos, árboles pequeños, huertos urbanos', mantenimiento: 'Alto: riego, poda, fertilización, drenaje activo', uso: 'Obra nueva o edificios con refuerzo estructural. Función de plaza ajardinada.', color: 'primary', icono: 'building' },
    ]);
    await insertIfMissing('aprende', 'beneficios', [
      { area: 'Térmico', dato: '−3.5 °C', desc: 'Reducción de temperatura superficial documentada en el TVLE del CIIEMAD.', color: 'accent', icono: 'thermometer' },
      { area: 'Hídrico', dato: '19.5 L/m²·año', desc: 'Captación pluvial promedio que se retiene en sustrato antes de ir al drenaje.', color: 'secondary', icono: 'water' },
      { area: 'Atmosférico', dato: '0.97 kg CO₂/m²·año', desc: 'Captura promedio anual. Equivale a 60.81 tCO₂/año en el inventario actual.', color: 'eco', icono: 'co2' },
      { area: 'Social y salud', dato: 'ODS 3 · 11 · 13', desc: 'Mejora calidad del aire, reduce isla de calor y aumenta bienestar psicológico.', color: 'teal', icono: 'heart' },
    ]);
    await insertIfMissing('aprende', 'casoIntro', [
      { title: 'El techo verde del CIIEMAD-IPN', subtitle: '6 m² instalados en la azotea del CIIEMAD-IPN en Gustavo A. Madero. Monitoreado durante dos años por la M. en C. Ana Laura Cervantes Nájera.', tag: 'Caso protagonista',
        body: 'Es la prueba de concepto que sostiene este observatorio: un techo verde ligero extensivo construido con capa drenante de paja y fibra de coco —en lugar de las membranas plásticas de los sistemas comerciales— y monitoreado científicamente. La conclusión: el TVLE genera 94.8 % menos huella de carbono que la solución convencional y se paga en 18 meses.' },
    ]);
    await insertIfMissing('aprende', 'casoCiiemad', [
      { label: 'Superficie experimental', valor: '6 m²' },
      { label: 'Tipología', valor: 'TVLE — Extensivo ligero' },
      { label: 'Periodo monitoreado', valor: '2019 – 2021' },
      { label: 'Recuperación de inversión', valor: '18 meses' },
      { label: 'Sobrevivencia vegetal', valor: '100 % todas las especies' },
      { label: 'Menor huella vs convencional', valor: '94.8 %' },
    ]);
    await insertIfMissing('aprende', 'galeria', [
      { src: '/images/tesis/techo-verde-ciiemad-panoramica.jpg', alt: 'Panorámica del techo verde del CIIEMAD con contexto urbano de Zacatenco', caption: 'Panorámica del techo verde con contexto urbano de Zacatenco' },
      { src: '/images/tesis/techo-verde-ciiemad-suculentas.jpg', alt: 'Echeverias y crasuláceas en el techo verde del CIIEMAD', caption: 'Detalle de echeverias y crasuláceas adaptadas al altiplano mexicano' },
      { src: '/images/tesis/techo-verde-ciiemad-echeverias-gravilla.jpg', alt: 'Echeverias separadas en cuadrícula sobre gravilla blanca, vista cenital', caption: 'Vista cenital: trazado de Echeverias sobre la capa drenante' },
      { src: '/images/tesis/techo-verde-ciiemad-modulo.jpg', alt: 'Módulo experimental del TVLE con cubierta vegetal mixta', caption: 'Módulo experimental con cubierta vegetal mixta' },
      { src: '/images/tesis/techo-verde-ciiemad-vegetacion-soleada.jpg', alt: 'Vegetación crasulácea creciendo sobre el techo del CIIEMAD bajo el sol', caption: 'Plantas crasuláceas creciendo en condiciones reales del altiplano' },
      { src: '/images/tesis/techo-verde-ciiemad-sedum-floracion.jpg', alt: 'Sedum en floración con cambio cromático verde a rojizo en el techo verde', caption: 'Sedum en floración — cambio cromático estacional' },
      { src: '/images/tesis/techo-verde-ciiemad-floracion.jpg', alt: 'Floración estacional en suculentas del techo verde', caption: 'Floración estacional en suculentas del techo' },
      { src: '/images/tesis/techo-verde-ciiemad-mantenimiento.jpg', alt: 'Equipo CIIEMAD durante trabajos de mantenimiento del techo verde', caption: 'Equipo CIIEMAD durante trabajos de mantenimiento' },
      { src: '/images/tesis/techo-verde-ciiemad-edificio.jpg', alt: 'Vista del techo verde con el edificio académico del CIIEMAD al fondo', caption: 'Vista del techo desde lo alto con el edificio académico al fondo' },
      { src: '/images/tesis/ciiemad-vista-aerea.png', alt: 'Vista aérea del edificio CIIEMAD-IPN mostrando la azotea del TVLE', caption: 'Vista aérea del CIIEMAD-IPN — localización del techo verde experimental' },
    ]);
    await insertIfMissing('aprende', 'cta', [
      { title: '¿Listo para profundizar?', body: 'Explora los techos que ya existen en la ciudad, identifica zonas prioritarias o suma información a la red.' },
    ]);

    // ─────────────── investigacion (resumen — el espejo completo está en cms-defaults.ts) ───────────────
    await insertIfMissing('investigacion', 'hero', [
      { eyebrow: 'Investigación', title: 'Marco académico del observatorio', subtitle: 'Este observatorio se sostiene en la línea de investigación de techos verdes del CIIEMAD-IPN. Aquí están las publicaciones, la metodología y los datos de origen abierto.' },
    ]);
    await insertIfMissing('investigacion', 'pesosAhp', [
      { variable: 'Isla de calor (LST)', peso: '30.19 %' },
      { variable: 'Cobertura vegetal (NDVI)', peso: '9.56 %' },
      { variable: 'Densidad poblacional', peso: '17.10 %' },
      { variable: 'Calidad del aire (O₃, NO₂)', peso: '12.85 %' },
      { variable: 'Riesgo hídrico', peso: '9.40 %' },
      { variable: 'Biodiversidad (Shannon)', peso: '8.75 %' },
      { variable: 'Contexto urbano', peso: '7.65 %' },
      { variable: 'Otros factores', peso: '4.50 %' },
    ]);

    // ─────────────── agenda-2030 — ods + datos ───────────────
    await insertIfMissing('agenda-2030', 'ods', [
      { num: 2, color: '#DDA63A', titulo: 'Hambre cero', metas: ['2.1 Acceso a alimentación nutricional', '2.3 Producción agrícola a pequeña escala', '2.4 Prácticas agrícolas sostenibles'], via: 'Agricultura urbana', rol: 'SA · SC', cita: 'En 2050, 2,000 millones de personas estarán en estado de inseguridad alimentaria (Naciones Unidas, 2016c). Los techos verdes complementan necesidades nutricionales por autoproducción (Azunre et al., 2019).' },
      { num: 3, color: '#4C9F38', titulo: 'Salud y bienestar', metas: ['3.4 Disminuir enfermedades no transmisibles', '3.9 Reducir muertes por contaminación'], via: 'Espacios verdes y reducción de partículas', rol: 'SC · SR', cita: '7 millones de muertes anuales por contaminación atmosférica; 4.2 millones por exposición a partículas finas (UN, 2016f). La vegetación retiene partículas contaminantes (Baik et al., 2012).' },
      { num: 6, color: '#26BDE2', titulo: 'Agua limpia y saneamiento', metas: ['6.3 Aumentar reciclaje y reúso del agua', '6.4 Empleo eficaz de los recursos hídricos', '6.a Tecnologías de captación y desalinización'], via: 'Captación pluvial y mitigación de inundaciones', rol: 'SA · SR', cita: 'El 40 % de los habitantes del planeta enfrentan problemas de agua (UN, 2016d). Los techos verdes captan agua de lluvia para autorriego y evitan inundaciones (Contreras-Bejarano & Villegas-González, 2019).' },
      { num: 7, color: '#FCC30B', titulo: 'Energía asequible y no contaminante', metas: ['7.3 Mejorar la eficiencia energética', '7.a Investigación e inversión en energías limpias'], via: 'Aislamiento térmico de edificios', rol: 'SR · SS', cita: 'El consumo energético urbano es responsable del 60 % de las emisiones de GEI (UN, 2016e). Los techos verdes generan ahorros por aislamiento térmico (Jaffal, Ouldboukhitine & Belarbi, 2012).' },
      { num: 11, color: '#FD9D24', titulo: 'Ciudades y comunidades sostenibles', metas: ['11.3 Urbanización inclusiva y sostenible', '11.6 Reducir el impacto ambiental, mejorar calidad del aire', '11.7 Acceso a zonas verdes y espacios públicos seguros'], via: 'Infraestructura verde urbana', rol: 'SR', cita: 'En 2050 se estima un crecimiento de 5,000 millones de habitantes en ciudades; éstas generan 75 % de las emisiones de carbono (Naciones Unidas, 2018). Los techos verdes son herramienta de sostenibilidad urbana (Langemeyer et al., 2020).' },
      { num: 13, color: '#3F7E44', titulo: 'Acción por el clima', metas: ['13.2 Integrar normas, políticas y planes nacionales'], via: 'Adaptación al cambio climático y reducción de isla de calor', rol: 'SR · SA · SS', cita: 'Al colocar vegetación en techos urbanos se reduce el efecto del albedo y se mitigan los efectos de la isla de calor (Sturiale & Scuderi, 2019).' },
      { num: 15, color: '#56C02B', titulo: 'Vida de ecosistemas terrestres', metas: ['15.5 Reducir la degradación y pérdida de biodiversidad'], via: 'Hábitat urbano para flora y fauna', rol: 'SR', cita: 'En los últimos 25 años el riesgo de extinción de especies de mamíferos, aves, anfibios y corales aumentó 10 % (UN, 2019b). Los techos verdes son hábitat incorporados a la infraestructura urbana (Brachet, Schiopu & Clergeau, 2020).' },
    ]);
    await insertIfMissing('agenda-2030', 'datos', [
      { target: 7, suffix: '', unidad: 'ODS', detalle: 'directamente vinculados al techo verde', fuente: 'Martínez Rodríguez & Cervantes-Nájera, 2023', href: 'https://doi.org/10.52501/cc.064.13' },
      { target: 17, suffix: '', unidad: 'metas', detalle: 'de la Agenda 2030 atendidas', fuente: 'Tabla 1, capítulo XIII', href: 'https://doi.org/10.52501/cc.064.13' },
      { target: 142, suffix: '', unidad: 'proyectos', detalle: 'de techos verdes registrados a nivel mundial', fuente: 'NATURVATION, 2018', href: 'https://naturvation.eu/atlas' },
      { display: '75 %', unidad: '', detalle: 'de las emisiones de carbono provienen de ciudades', fuente: 'Naciones Unidas, 2018', href: 'https://unstats.un.org/sdgs/report/2019/goal-11/' },
      { display: '7 M', unidad: 'muertes/año', detalle: 'por contaminación atmosférica', fuente: 'United Nations, 2016f', href: 'https://unstats.un.org/sdgs/report/2019/goal-03/' },
      { display: '60 %', unidad: '', detalle: 'del consumo energético urbano genera GEI', fuente: 'United Nations, 2016e', href: 'https://www.un.org/sustainabledevelopment/es/energy/' },
    ]);

    // ─────────────── indicadores.kpis (8 header cards) ───────────────
    await insertIfMissing('indicadores', 'kpis', [
      { label: 'Techos verdes registrados', valor: 57, unidad: 'techos', icono: 'leaf', color: 'primary', cambio: '+8 en 2024' },
      { label: 'Superficie total cubierta', valor: '98,430', unidad: 'm²', icono: 'area', color: 'eco', cambio: '+12,600 m²' },
      { label: 'Candidatos priorizados', valor: 60, unidad: 'sitios', icono: 'target', color: 'secondary', cambio: '+15 nuevos' },
      { label: 'Captura de CO₂ del inventario', valor: '60.81', unidad: 'tCO₂/año', icono: 'co2', color: 'accent', cambio: 'Cervantes-Nájera 2025' },
      { label: 'Alcaldías con techos verdes', valor: 14, unidad: 'de 16', icono: 'map', color: 'primary' },
      { label: 'Variables del modelo', valor: 8, unidad: 'variables', icono: 'chart', color: 'secondary' },
      { label: 'Score promedio candidatos', valor: 81.5, unidad: 'pts', icono: 'score', color: 'eco', cambio: '+3.2 vs anterior' },
      { label: 'Pilotos activos', valor: 4, unidad: 'proyectos', icono: 'pilot', color: 'accent', cambio: '+2 en Q1' },
    ]);

    // ─────────────── metodologia.pasos — shape extendido ───────────────
    // El seed 1740 sembró `pasos` con shape simple (title + description). El
    // template actual usa `number + icono + color + details[]`. Si seguimos
    // con el shape viejo, las fun-cards renderizan sin icono. Sobrescribimos
    // SOLO si el primer item no trae `number`.
    await upsertIfStaleShape('metodologia', 'pasos', [
      { number: 1, title: 'Recopilación de datos geoespaciales', description: 'Integración de múltiples fuentes de datos espaciales, incluyendo imágenes satelitales, datos censales y estaciones de monitoreo.', icono: 'satellite', color: 'secondary', details: ['Imágenes Landsat y MODIS para temperatura superficial', 'Datos del INEGI para población y área urbanizada', 'Estaciones RAMA para calidad del aire', 'Coberturas de uso de suelo de SEDEMA'] },
      { number: 2, title: 'Construcción del índice de aptitud', description: 'Normalización y ponderación de variables en un índice multicriterio de aptitud territorial.', icono: 'scale', color: 'violet', details: ['Normalización 0-100 por variable', 'Ponderación por Proceso Analítico Jerárquico (AHP)', 'Validación cruzada con expertos', 'Clasificación en 5 niveles de aptitud'] },
      { number: 3, title: 'Validación de campo', description: 'Verificación manual con expertos del CIIEMAD-IPN siguiendo la metodología de Cervantes-Nájera. Fotografía aérea, observaciones de campo y revisión de catastro.', icono: 'shield', color: 'accent', details: ['Revisión de imagen aérea de alta resolución', 'Validación territorial con expertos', 'Cruce con catastro y dictámenes oficiales', 'Nivel de confianza por sitio'] },
      { number: 4, title: 'Priorización territorial', description: 'Integración de los resultados del modelo de aptitud con las validaciones de campo para identificar y priorizar sitios candidatos.', icono: 'flag', color: 'rose', details: ['Cruce de aptitud con inventario existente', 'Identificación de zonas de alta prioridad', 'Generación de fichas por candidato', 'Datos abiertos para consulta pública'] },
    ], 'number');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Down: solo elimina las secciones sembradas POR esta migración
    // (updatedBy = 'migration:1742'). Si el editor las modificó, NO las toca.
    await queryRunner.query(
      `DELETE FROM obs_cms_sections WHERE observatory = 'techos-verdes' AND updatedBy = 'migration:1742'`,
    );
  }
}
