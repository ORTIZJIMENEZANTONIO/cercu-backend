import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fase 3 del detector de invasión costera:
 *  - Muestreo polígono-completo en lugar de centroide (campos NDBI/NDVI ya
 *    existen, sólo añadimos `samplingMethod` para auditar qué método se usó).
 *  - NDVI como señal corroborativa: si NDBI subió pero NDVI no bajó, es
 *    sospechoso (no se aclaró vegetación → menos probable nueva construcción
 *    pétrea).
 *  - Serie temporal anual (10 años) opt-in para cada candidato verificado.
 *
 * Idempotente.
 */
export class AddPhase3FieldsToCoastalIntrusions1732000000000 implements MigrationInterface {
  name = 'AddPhase3FieldsToCoastalIntrusions1732000000000';

  private async addColumnIfMissing(qr: QueryRunner, table: string, col: string, ddl: string) {
    const existing = await qr.query(`SHOW COLUMNS FROM \`${table}\` LIKE '${col}'`);
    if (existing.length === 0) {
      await qr.query(`ALTER TABLE \`${table}\` ADD COLUMN ${ddl}`);
    }
  }

  public async up(qr: QueryRunner): Promise<void> {
    const t = 'obs_coastal_intrusions';
    await this.addColumnIfMissing(qr, t, 'ndviBaseline', '`ndviBaseline` decimal(6,4) NULL');
    await this.addColumnIfMissing(qr, t, 'ndviCurrent',  '`ndviCurrent` decimal(6,4) NULL');
    await this.addColumnIfMissing(qr, t, 'ndviDelta',    '`ndviDelta` decimal(6,4) NULL');
    await this.addColumnIfMissing(qr, t, 'samplingMethod', `\`samplingMethod\` varchar(16) NULL`);
    await this.addColumnIfMissing(qr, t, 'noveltyTimeSeries', '`noveltyTimeSeries` json NULL');
  }

  public async down(qr: QueryRunner): Promise<void> {
    const t = 'obs_coastal_intrusions';
    for (const col of ['noveltyTimeSeries', 'samplingMethod', 'ndviDelta', 'ndviCurrent', 'ndviBaseline']) {
      const existing = await qr.query(`SHOW COLUMNS FROM \`${t}\` LIKE '${col}'`);
      if (existing.length > 0) {
        await qr.query(`ALTER TABLE \`${t}\` DROP COLUMN \`${col}\``);
      }
    }
  }
}
