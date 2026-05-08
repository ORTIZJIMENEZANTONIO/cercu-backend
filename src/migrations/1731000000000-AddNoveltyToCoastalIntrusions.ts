import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fase 2 del detector de invasión costera: detección de cambio temporal
 * vía NDBI (Normalized Difference Built-up Index) sobre dos epochs Sentinel-2.
 *
 * Añade 6 columnas a `obs_coastal_intrusions`:
 *   - ndbiBaseline: NDBI medio sobre el footprint en el epoch antiguo
 *   - ndbiCurrent: NDBI medio sobre el footprint en el epoch reciente
 *   - ndbiDelta: ndbiCurrent - ndbiBaseline
 *   - noveltyScore: 0-100 (mayor = más probable que sea construcción nueva)
 *   - noveltyAnalyzedAt: cuándo se corrió el análisis
 *   - noveltyEpochs: JSON {baseline: 'YYYY-MM-DD', current: 'YYYY-MM-DD'}
 *
 * NULL = aún no analizada.
 *
 * Idempotente: chequea cada columna individualmente con SHOW COLUMNS LIKE.
 */
export class AddNoveltyToCoastalIntrusions1731000000000 implements MigrationInterface {
  name = 'AddNoveltyToCoastalIntrusions1731000000000';

  private async addColumnIfMissing(
    qr: QueryRunner,
    table: string,
    column: string,
    ddl: string,
  ) {
    const existing = await qr.query(`SHOW COLUMNS FROM \`${table}\` LIKE '${column}'`);
    if (existing.length === 0) {
      await qr.query(`ALTER TABLE \`${table}\` ADD COLUMN ${ddl}`);
    }
  }

  public async up(qr: QueryRunner): Promise<void> {
    const table = 'obs_coastal_intrusions';
    await this.addColumnIfMissing(qr, table, 'ndbiBaseline', '`ndbiBaseline` decimal(6,4) NULL');
    await this.addColumnIfMissing(qr, table, 'ndbiCurrent',  '`ndbiCurrent` decimal(6,4) NULL');
    await this.addColumnIfMissing(qr, table, 'ndbiDelta',    '`ndbiDelta` decimal(6,4) NULL');
    await this.addColumnIfMissing(qr, table, 'noveltyScore', '`noveltyScore` decimal(5,2) NULL');
    await this.addColumnIfMissing(qr, table, 'noveltyAnalyzedAt', '`noveltyAnalyzedAt` datetime NULL');
    await this.addColumnIfMissing(qr, table, 'noveltyEpochs', '`noveltyEpochs` json NULL');
  }

  public async down(qr: QueryRunner): Promise<void> {
    const table = 'obs_coastal_intrusions';
    for (const col of ['noveltyEpochs', 'noveltyAnalyzedAt', 'noveltyScore', 'ndbiDelta', 'ndbiCurrent', 'ndbiBaseline']) {
      const existing = await qr.query(`SHOW COLUMNS FROM \`${table}\` LIKE '${col}'`);
      if (existing.length > 0) {
        await qr.query(`ALTER TABLE \`${table}\` DROP COLUMN \`${col}\``);
      }
    }
  }
}
