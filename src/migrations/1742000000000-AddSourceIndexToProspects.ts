import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Añade un índice compuesto sobre (observatory, source) en
 * `obs_prospect_submissions` para acelerar los listados filtrados por
 * fuente — en particular el filtro `source='comunidad'` que usa la cola
 * de aportes ciudadanos desde `/admin/prospectos`.
 *
 * Idempotente: verifica si el índice ya existe antes de crearlo.
 *
 * Contexto: el endpoint público `POST /:observatory/comunidad/aportes`
 * (módulo `comunidad/`) crea ProspectSubmissions con
 * `source = ProspectSource.COMUNIDAD`. Ese valor convive con
 * 'ia_detector', 'manual' y 'externo'. Sin un índice, los filtros del
 * admin requerirían un table scan completo cuando crezcan los aportes.
 */
export class AddSourceIndexToProspects1742000000000
  implements MigrationInterface
{
  name = 'AddSourceIndexToProspects1742000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tbl = await queryRunner.query(
      `SHOW TABLES LIKE 'obs_prospect_submissions'`,
    );
    if (tbl.length === 0) {
      // La tabla aún no existe — la migración 1734 la crea. Skip y log.
      // eslint-disable-next-line no-console
      console.log(
        '[1742] obs_prospect_submissions no existe aún; skip índice. ' +
          'Reintentar tras 1734.',
      );
      return;
    }

    const existing = await queryRunner.query(
      `SHOW INDEX FROM obs_prospect_submissions WHERE Key_name = 'IDX_prospect_obs_source'`,
    );
    if (existing.length === 0) {
      await queryRunner.query(
        `CREATE INDEX \`IDX_prospect_obs_source\`
           ON \`obs_prospect_submissions\` (\`observatory\`, \`source\`)`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.query(
      `SHOW INDEX FROM obs_prospect_submissions WHERE Key_name = 'IDX_prospect_obs_source'`,
    );
    if (existing.length > 0) {
      await queryRunner.query(
        `DROP INDEX \`IDX_prospect_obs_source\` ON \`obs_prospect_submissions\``,
      );
    }
  }
}
