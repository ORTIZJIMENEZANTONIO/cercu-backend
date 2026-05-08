import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Siembra las secciones del CMS expandido para humedales y techos-verdes.
 *
 * Patrón idempotente: para cada (observatory, pageSlug, sectionKey), verifica
 * si ya existe una fila en obs_cms_sections. Si no existe, inserta los
 * defaults; si existe, NO sobrescribe (para preservar cambios hechos por
 * editores humanos en producción).
 *
 * Cubre el gap entre observatory-content.seed.ts (que solo corre en BBDDs
 * vacías con count===0) y la realidad: BBDDs en producción que ya tienen
 * algunas secciones sembradas y necesitan que las nuevas (especialmente el
 * recién añadido home.hero de humedales) aparezcan en /admin/contenido.
 */
export class SeedExpandedCmsSections1740000000000 implements MigrationInterface {
  name = 'SeedExpandedCmsSections1740000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Helper interno: insert si no existe ─────────────────────────────────
    const upsertSection = async (
      observatory: string,
      pageSlug: string,
      sectionKey: string,
      items: any[],
    ) => {
      const existing = await queryRunner.query(
        `SELECT id FROM obs_cms_sections WHERE observatory = ? AND pageSlug = ? AND sectionKey = ? LIMIT 1`,
        [observatory, pageSlug, sectionKey],
      );
      if (existing.length === 0) {
        await queryRunner.query(
          `INSERT INTO obs_cms_sections (observatory, pageSlug, sectionKey, items, updatedBy) VALUES (?, ?, ?, ?, ?)`,
          [observatory, pageSlug, sectionKey, JSON.stringify(items), 'migration:1740'],
        );
      }
    };

    // ════════════════════════════════════════════════════════════════════════
    //  HUMEDALES — espejo completo de cms-defaults.ts del frontend
    // ════════════════════════════════════════════════════════════════════════

    // home.hero (NUEVO — el campo que el usuario reporto que no era editable)
    await upsertSection('humedales', 'home', 'hero', [
      {
        eyebrow: 'Plataforma abierta',
        titleLine1: 'Observatorio de',
        titleLine2: 'Humedales Artificiales',
        titleLine3: 'CDMX',
        subtitle: 'Monitoreo, inventario y análisis de humedales artificiales en la Ciudad de México. Infraestructura verde y soluciones basadas en la naturaleza.',
        primaryLabel: 'Explorar inventario',
        primaryTo: '/inventario',
        primaryIcon: 'lucide:compass',
        secondaryLabel: 'Registra tu humedal',
        secondaryTo: '/registra',
      },
    ]);

    // home.steps
    await upsertSection('humedales', 'home', 'steps', [
      { title: 'Identificación', description: 'Localización de humedales artificiales existentes en la CDMX mediante fuentes oficiales, académicas y de trabajo de campo.' },
      { title: 'Caracterización', description: 'Documentación de tipo, vegetación, sustrato, superficie y capacidad de tratamiento.' },
      { title: 'Análisis', description: 'Evaluación de servicios ecosistémicos y comparación entre tipologías de humedales.' },
      { title: 'Visualización', description: 'Presentación interactiva en mapas y gráficas para tomadores de decisiones.' },
    ]);

    // home.servicios
    await upsertSection('humedales', 'home', 'servicios', [
      { title: 'Tratamiento de agua', icon: 'lucide:droplets' },
      { title: 'Hábitat para fauna', icon: 'lucide:bird' },
      { title: 'Captura de carbono', icon: 'lucide:leaf' },
      { title: 'Regulación térmica', icon: 'lucide:thermometer' },
      { title: 'Control de inundaciones', icon: 'lucide:waves' },
      { title: 'Educación ambiental', icon: 'lucide:book-open' },
    ]);

    // sobre.objetivos
    await upsertSection('humedales', 'sobre', 'objetivos', [
      { title: 'Sistematizar', description: 'Organizar la información dispersa sobre humedales artificiales en la CDMX en un repositorio accesible.', icon: '📋' },
      { title: 'Visualizar', description: 'Mostrar la distribución geoespacial y características técnicas de cada humedal en mapas interactivos.', icon: '🗺️' },
      { title: 'Analizar', description: 'Evaluar los servicios ecosistémicos y su contribución a la sustentabilidad urbana de la ciudad.', icon: '📊' },
    ]);

    // sobre.normativas
    await upsertSection('humedales', 'sobre', 'normativas', [
      { title: 'Ley de Aguas de la CDMX', description: 'Marco regulatorio para el manejo integral del agua en la Ciudad de México.' },
      { title: 'Programa de Medio Ambiente CDMX', description: 'Estrategia de sustentabilidad que incluye infraestructura verde.' },
      { title: 'NOM-001-SEMARNAT-2021', description: 'Límites permisibles de contaminantes en descargas de aguas residuales.' },
      { title: 'ODS 6 — Agua limpia y saneamiento', description: 'Garantizar la disponibilidad y gestión sostenible del agua.' },
      { title: 'ODS 11 — Ciudades sostenibles', description: 'Lograr que ciudades sean inclusivas, seguras, resilientes y sostenibles.' },
      { title: 'ODS 15 — Vida de ecosistemas terrestres', description: 'Proteger, restaurar y promover el uso sostenible de los ecosistemas.' },
    ]);

    // analisis.sections (hub gateway cards)
    await upsertSection('humedales', 'analisis', 'sections', [
      { to: '/analisis/indicadores', title: 'Indicadores y distribución', description: 'Gráficas de distribución geográfica, tipológica y de servicios ecosistémicos. Evidencia científica de eficiencia.', icon: 'lucide:bar-chart-3', bg: 'bg-primary-50', iconColor: 'text-primary', accentColor: 'bg-primary' },
      { to: '/analisis/brecha', title: 'Brecha de cobertura', description: 'Análisis de las 16 alcaldías: índice de necesidad, mapa de cobertura y ranking de prioridad.', icon: 'lucide:map', bg: 'bg-eco/10', iconColor: 'text-eco', accentColor: 'bg-eco' },
      { to: '/analisis/hallazgos', title: 'Hallazgos y recomendaciones', description: 'Síntesis del inventario Fase 1, comparativo de costos y propuestas para la política pública.', icon: 'lucide:lightbulb', bg: 'bg-accent/10', iconColor: 'text-accent-dark', accentColor: 'bg-accent' },
    ]);

    // inventario
    await upsertSection('humedales', 'inventario', 'hero', [
      { title: 'Inventario de humedales', subtitle: 'Sistema de búsqueda, filtros y vista detallada de los humedales artificiales documentados en CDMX.', cta: 'Registra un humedal', ctaLink: '/registra' },
    ]);
    await upsertSection('humedales', 'inventario', 'helpText', [
      { title: '¿Qué encontrarás aquí?', description: 'Cada tarjeta muestra el tipo de humedal (FWS / SFS / Híbrido), año, alcaldía, vegetación y servicios ecosistémicos documentados. Toca una tarjeta para ver la ficha completa.' },
    ]);

    // mapa
    await upsertSection('humedales', 'mapa', 'hero', [
      { title: 'Mapa interactivo', subtitle: 'Distribución geográfica de los humedales artificiales en la CDMX. Cada marcador despliega los datos clave del sitio.', cta: 'Ver inventario', ctaLink: '/inventario' },
    ]);
    await upsertSection('humedales', 'mapa', 'legend', [
      { color: 'bg-primary', label: 'Activo', description: 'Humedal en operación regular' },
      { color: 'bg-accent', label: 'En expansión', description: 'En construcción de etapa nueva' },
      { color: 'bg-secondary', label: 'Piloto', description: 'Demostrativo o experimental' },
      { color: 'bg-slate-400', label: 'Pendiente verificación', description: 'Sitio reportado sin confirmación oficial' },
    ]);

    // notihumedal
    await upsertSection('humedales', 'notihumedal', 'hero', [
      { title: 'Notihumedal', subtitle: 'Notas, comunicados y publicaciones recientes sobre humedales artificiales en CDMX y México.', cta: '', ctaLink: '' },
    ]);
    await upsertSection('humedales', 'notihumedal', 'emptyState', [
      { title: 'Aún no hay artículos', description: 'Los nuevos artículos publicados aparecerán aquí. También puedes seguirnos por RSS.' },
    ]);

    // registra
    await upsertSection('humedales', 'registra', 'hero', [
      { title: 'Registra un humedal', subtitle: 'Aporta tu conocimiento al observatorio. Tu reporte pasa por revisión de un especialista antes de publicarse.', cta: '', ctaLink: '' },
    ]);
    await upsertSection('humedales', 'registra', 'steps', [
      { title: 'Paso 1', label: 'Datos técnicos', description: 'Ubicación, tipo de flujo, vegetación, sustrato y capacidad. Llena lo que tengas; los campos opcionales se pueden completar después.' },
      { title: 'Paso 2', label: 'Documento de respaldo', description: 'Si tienes un PDF, paper o reporte que documente el humedal, súbelo o pega el enlace. Es opcional pero acelera la verificación.' },
      { title: 'Paso 3', label: 'Confirmación', description: 'Revisa el resumen y envía. Recibirás respuesta del equipo en 5–10 días hábiles.' },
    ]);
    await upsertSection('humedales', 'registra', 'confirmation', [
      { title: '¡Gracias por tu aporte!', description: 'Tu reporte entró a la cola de revisión. Si proporcionaste correo, te avisaremos del resultado. Mientras tanto puedes seguir explorando el inventario.' },
    ]);

    // analisis-indicadores
    await upsertSection('humedales', 'analisis-indicadores', 'hero', [
      { title: 'Indicadores', subtitle: 'Distribución, servicios ecosistémicos, comparativa técnica y evidencia científica.' },
    ]);
    await upsertSection('humedales', 'analisis-indicadores', 'tabs', [
      { id: 'distribucion', label: 'Distribución', description: 'Por alcaldía, tipología y superficie' },
      { id: 'servicios', label: 'Servicios ecosistémicos', description: 'Frecuencia y matriz humedal × servicio' },
      { id: 'comparativo', label: 'Análisis comparativo', description: 'Timeline + tabla técnica completa' },
      { id: 'evidencia', label: 'Evidencia científica', description: 'Eficiencias documentadas y respaldo académico' },
    ]);

    // analisis-brecha
    await upsertSection('humedales', 'analisis-brecha', 'hero', [
      { title: 'Brecha de cobertura', subtitle: 'Las 9 alcaldías sin humedal artificial vs. las 7 que ya tienen. Índice de necesidad y ranking.' },
    ]);
    await upsertSection('humedales', 'analisis-brecha', 'methodology', [
      { title: 'Cómo se calcula el índice de necesidad', description: 'IN = (inundación × 0.30) + (calor × 0.25) + (escasez de agua × 0.30) + (densidad poblacional normalizada × 0.15). Escalas 1–5 ordinales.' },
    ]);

    // analisis-hallazgos
    await upsertSection('humedales', 'analisis-hallazgos', 'hero', [
      { title: 'Hallazgos y recomendaciones', subtitle: 'Síntesis del inventario Fase 1: 4 hallazgos, recomendaciones de política pública y comparativo de costos.' },
    ]);
    await upsertSection('humedales', 'analisis-hallazgos', 'callToAction', [
      { title: 'Quiero participar en política pública', description: 'Si representas a una alcaldía, dependencia o universidad y quieres explorar implementar humedales artificiales, escríbenos.', cta: 'Contacto', ctaLink: '/sobre' },
    ]);

    // contributors (la nueva pagina del sistema de tiers)
    await upsertSection('humedales', 'contributors', 'hero', [
      { title: 'Red de contribuyentes', subtitle: 'Personas, instituciones y comunidades que aportan al observatorio. Cinco modos de participación.' },
    ]);
    await upsertSection('humedales', 'contributors', 'intro', [
      { title: 'Cinco modos de participación', description: 'Cada modo es una forma distinta de aportar (no un nivel a alcanzar). Aprendiz reporta, Observador da seguimiento, Caracterizador mide, Especialista investiga, Custodio resguarda.' },
    ]);

    // footer
    await upsertSection('humedales', 'footer', 'brand', [
      { title: 'Observatorio de Humedales Artificiales CDMX', subtitle: 'Una iniciativa CIIEMAD-IPN', description: 'Plataforma de monitoreo, inventario y análisis de humedales artificiales en la Ciudad de México.' },
    ]);
    await upsertSection('humedales', 'footer', 'sources', [
      { label: 'CIIEMAD — IPN', href: 'https://www.ciiemad.ipn.mx' },
      { label: 'CONAGUA — Inventario Nacional de Humedales', href: 'https://sigagis.conagua.gob.mx/humedales/' },
      { label: 'CONABIO — SIMOH-Mx', href: 'https://www.biodiversidad.gob.mx/monitoreo/simoh-mx' },
      { label: 'OpenStreetMap (Overpass API)', href: 'https://overpass-api.de' },
    ]);
    await upsertSection('humedales', 'footer', 'quickLinks', [
      { label: 'Mapa', to: '/mapa' },
      { label: 'Inventario', to: '/inventario' },
      { label: 'Análisis', to: '/analisis' },
      { label: 'Notihumedal', to: '/notihumedal' },
      { label: 'Sobre', to: '/sobre' },
      { label: 'Registra un humedal', to: '/registra' },
    ]);
    await upsertSection('humedales', 'footer', 'legal', [
      { body: 'Plataforma de datos abiertos. Licencia de software Apache 2.0. Contenido editorial bajo licencia CC BY 4.0 con atribución al inventario Fase 1 (Domínguez Solís, CIIEMAD-IPN).', copyright: '© 2026 Observatorio de Humedales Artificiales CDMX.' },
    ]);

    console.log('  Humedales CMS expanded: ~25 sections upserted (skips existing)');

    // ════════════════════════════════════════════════════════════════════════
    //  TECHOS-VERDES — solo añade contributors si falta (resto ya seedeado)
    // ════════════════════════════════════════════════════════════════════════
    await upsertSection('techos-verdes', 'contributors', 'hero', [
      {
        eyebrow: 'Red de la comunidad',
        title: 'Contribuyentes',
        subtitle: 'Personas, instituciones y empresas que aportan al observatorio. Cinco modos de participación distintos — no niveles a alcanzar.',
      },
    ]);
    await upsertSection('techos-verdes', 'contributors', 'intro', [
      { title: 'Cinco modos de participación', description: 'Aprendiz reporta, Reportador da seguimiento, Caracterizador mide, Especialista diseña, Operador opera. Cada uno aporta de forma distinta y complementaria.' },
    ]);

    console.log('  Techos-verdes CMS: contributors section upserted');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No hay rollback semantico: las secciones podrian haber sido editadas
    // por humanos despues de la migracion. Borrarlas en duro destruiria contenido.
    // Solo limpiamos las que coincidan con updatedBy = 'migration:1740' (es decir,
    // las que esta migracion creo y nadie ha tocado desde entonces).
    await queryRunner.query(
      `DELETE FROM obs_cms_sections WHERE updatedBy = 'migration:1740'`
    );
  }
}
