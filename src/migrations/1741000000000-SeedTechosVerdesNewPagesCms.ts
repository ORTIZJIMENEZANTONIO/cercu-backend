import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Siembra las secciones del CMS para las 3 páginas nuevas del observatorio
 * de techos verdes: agenda-2030, referencias, comunidad.
 *
 * Patrón idempotente igual al 1740: para cada (observatory, pageSlug,
 * sectionKey) verifica si ya existe; si no, inserta los defaults; si existe,
 * NO sobrescribe (preserva contenido editado).
 *
 * Espejo de los defaults definidos en
 *   observatorio-techos-verdes/data/cms-defaults.ts
 * sección `'agenda-2030'`, `'referencias'`, `'comunidad'`.
 */
export class SeedTechosVerdesNewPagesCms1741000000000
  implements MigrationInterface
{
  name = 'SeedTechosVerdesNewPagesCms1741000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const upsertSection = async (
      pageSlug: string,
      sectionKey: string,
      items: any[],
    ) => {
      const existing = await queryRunner.query(
        `SELECT id FROM obs_cms_sections
           WHERE observatory = ? AND pageSlug = ? AND sectionKey = ?
           LIMIT 1`,
        ['techos-verdes', pageSlug, sectionKey],
      );
      if (existing.length === 0) {
        await queryRunner.query(
          `INSERT INTO obs_cms_sections
             (observatory, pageSlug, sectionKey, items, updatedBy)
           VALUES (?, ?, ?, ?, ?)`,
          [
            'techos-verdes',
            pageSlug,
            sectionKey,
            JSON.stringify(items),
            'migration:1741',
          ],
        );
      }
    };

    // ── /agenda-2030 ────────────────────────────────────────────────────────
    await upsertSection('agenda-2030', 'hero', [
      {
        eyebrow: 'ODS 13 · Acción por el clima',
        titleLine1: 'Techos verdes en las áreas urbanas',
        titleLine2: 'y su relación con la Agenda 2030',
        subtitle:
          'Las soluciones basadas en la naturaleza (SbN) responden a 7 Objetivos de Desarrollo Sostenible. Este observatorio toma como base el capítulo de Martínez Rodríguez y Cervantes-Nájera (CIIEMAD-IPN, 2023) y lo aterriza al territorio de la Ciudad de México.',
      },
    ]);
    await upsertSection('agenda-2030', 'intro', [
      {
        title: 'Argumento del capítulo',
        body: 'Las ciudades enfrentan la disminución de espacios abiertos y naturales, los cuales aportan servicios ecosistémicos esenciales. Las SbN aprovechan los ecosistemas en beneficio de la sociedad; los techos verdes son una de estas soluciones para recuperar áreas verdes urbanas (AVU).',
      },
    ]);

    // ── /referencias ────────────────────────────────────────────────────────
    await upsertSection('referencias', 'hero', [
      {
        eyebrow: 'Marco académico e institucional',
        titleLine1: 'Referencias del observatorio',
        subtitle:
          'Las fuentes académicas, técnicas y normativas que respaldan los datos, modelos y decisiones presentadas en esta plataforma.',
      },
    ]);

    // ── /comunidad ──────────────────────────────────────────────────────────
    await upsertSection('comunidad', 'hero', [
      {
        eyebrow: 'Comunidad abierta',
        titleLine1: 'Sé parte del observatorio',
        subtitle:
          'Este observatorio se construye en colectivo. Cinco modos de participar — desde el reporte ciudadano hasta la operación institucional — abiertos a quien quiera sumar.',
        primaryLabel: 'Quiero aportar',
        primaryTo: '#aportar',
        secondaryLabel: 'Ver modos de participación',
        secondaryTo: '#tiers',
      },
    ]);
    await upsertSection('comunidad', 'intro', [
      {
        title: 'El observatorio se construye en colectivo',
        body: 'Mapear los techos verdes de la Ciudad de México requiere muchos ojos. Algunas azoteas son visibles desde la calle, otras solo desde edificios vecinos, otras están documentadas en tesis y reportes técnicos que no han sido digitalizados.',
      },
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Solo elimina las secciones marcadas con `migration:1741` para no
    // borrar contenido editado por humanos sobre estas mismas claves.
    await queryRunner.query(
      `DELETE FROM obs_cms_sections
         WHERE observatory = 'techos-verdes'
           AND pageSlug IN ('agenda-2030', 'referencias', 'comunidad')
           AND updatedBy = 'migration:1741'`,
    );
  }
}
