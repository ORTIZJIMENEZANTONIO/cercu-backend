import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Reframe del tier system: cada escala se presenta como un MODO distinto
 * de aportar (no un nivel a alcanzar). El contenido del modo —título
 * visible, audiencia, aportes típicos, puente con otros modos— vivía
 * hardcoded en `pages/contributors/index.vue`. Esta migración mueve esos
 * 4 campos a la BD para que `/admin/tiers` los edite vía CRUD normal.
 *
 *   modeTitle      varchar(150) — "Curiosidad ciudadana", etc.
 *   audience       text         — quién aporta así
 *   contributions  json         — array de aportes típicos (3–5 items)
 *   bridge         text         — cómo conecta con los otros modos
 *
 * Idempotente.
 */
export class AddModeFieldsToObsTiers1735000000000 implements MigrationInterface {
  name = 'AddModeFieldsToObsTiers1735000000000';

  private async addColumnIfMissing(qr: QueryRunner, table: string, col: string, ddl: string) {
    const existing = await qr.query(`SHOW COLUMNS FROM \`${table}\` LIKE '${col}'`);
    if (existing.length === 0) {
      await qr.query(`ALTER TABLE \`${table}\` ADD COLUMN ${ddl}`);
    }
  }

  public async up(qr: QueryRunner): Promise<void> {
    const t = 'obs_tiers';
    await this.addColumnIfMissing(qr, t, 'modeTitle',     '`modeTitle` varchar(150) NULL');
    await this.addColumnIfMissing(qr, t, 'audience',      '`audience` text NULL');
    await this.addColumnIfMissing(qr, t, 'contributions', '`contributions` json NULL');
    await this.addColumnIfMissing(qr, t, 'bridge',        '`bridge` text NULL');
  }

  public async down(qr: QueryRunner): Promise<void> {
    const t = 'obs_tiers';
    for (const col of ['bridge', 'contributions', 'audience', 'modeTitle']) {
      const existing = await qr.query(`SHOW COLUMNS FROM \`${t}\` LIKE '${col}'`);
      if (existing.length > 0) {
        await qr.query(`ALTER TABLE \`${t}\` DROP COLUMN \`${col}\``);
      }
    }
  }
}
