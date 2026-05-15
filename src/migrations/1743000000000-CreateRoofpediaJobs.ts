import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Crea la tabla `obs_roofpedia_jobs` para tracking de jobs de Roofpedia.
 * Idempotente: usa `if not exists` y `SHOW INDEX` antes de crear el índice.
 *
 * Ver entidad: src/entities/observatory/RoofpediaJob.ts
 */
export class CreateRoofpediaJobs1743000000000 implements MigrationInterface {
  name = 'CreateRoofpediaJobs1743000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('obs_roofpedia_jobs');
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'obs_roofpedia_jobs',
          columns: [
            { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
            { name: 'publicId', type: 'varchar', length: '36', isUnique: true },
            { name: 'observatory', type: 'varchar', length: '50' },
            { name: 'alcaldiaSlug', type: 'varchar', length: '80' },
            { name: 'alcaldiaNombre', type: 'varchar', length: '120' },
            { name: 'status', type: 'varchar', length: '20', default: "'pending'" },
            { name: 'requestedBy', type: 'varchar', length: '36' },
            { name: 'costEstimateUsd', type: 'decimal', precision: 8, scale: 2, default: 0 },
            { name: 'pid', type: 'int', isNullable: true },
            { name: 'logPath', type: 'varchar', length: '255', isNullable: true },
            { name: 'errorMessage', type: 'varchar', length: '500', isNullable: true },
            { name: 'startedAt', type: 'datetime', isNullable: true },
            { name: 'finishedAt', type: 'datetime', isNullable: true },
            { name: 'result', type: 'json', isNullable: true },
            { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP(6)', precision: 6 },
            { name: 'updatedAt', type: 'datetime', default: 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)', precision: 6 },
          ],
        }),
        true,
      );
    }

    // Índice compuesto (observatory, status) — el lock global de "1 job
    // running" hace `WHERE observatory=? AND status='running' LIMIT 1`
    const indexExists = await queryRunner.query(
      `SHOW INDEX FROM obs_roofpedia_jobs WHERE Key_name = 'IDX_roofpedia_obs_status'`,
    );
    if (!indexExists.length) {
      await queryRunner.createIndex(
        'obs_roofpedia_jobs',
        new TableIndex({
          name: 'IDX_roofpedia_obs_status',
          columnNames: ['observatory', 'status'],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('obs_roofpedia_jobs')) {
      await queryRunner.dropTable('obs_roofpedia_jobs');
    }
  }
}
