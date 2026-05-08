import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Añade la columna `observatory` a `obs_cms_sections` para soportar multi-tenant
 * (humedales / arrecifes / techos-verdes / …). Antes de esta migración la tabla
 * no tenía esa columna y todos los registros pertenecían implícitamente a
 * humedales (el único observatorio que la usaba).
 *
 * Backfill: filas existentes se etiquetan como `'humedales'` (preserva el
 * comportamiento actual). Después se añade un índice compuesto
 * `(observatory, pageSlug, sectionKey)` para el lookup rápido del servicio.
 *
 * Idempotente: cada paso checa con `SHOW COLUMNS / INDEX` antes de aplicar.
 */
export class AddObservatoryToCmsSections1736000000000 implements MigrationInterface {
  name = 'AddObservatoryToCmsSections1736000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tbl = await queryRunner.query(`SHOW TABLES LIKE 'obs_cms_sections'`);
    if (tbl.length === 0) return;

    const cols = await queryRunner.query(
      `SHOW COLUMNS FROM \`obs_cms_sections\` LIKE 'observatory'`,
    );
    if (cols.length === 0) {
      await queryRunner.query(
        `ALTER TABLE \`obs_cms_sections\` ADD COLUMN \`observatory\` varchar(50) NOT NULL DEFAULT 'humedales' AFTER \`id\``,
      );
      // Backfill explícito: las filas previas a esta columna son de humedales.
      await queryRunner.query(
        `UPDATE \`obs_cms_sections\` SET \`observatory\` = 'humedales' WHERE \`observatory\` = 'humedales' OR \`observatory\` IS NULL`,
      );
    }

    const idx = await queryRunner.query(
      `SHOW INDEX FROM \`obs_cms_sections\` WHERE Key_name = 'idx_obs_cms_sections_lookup'`,
    );
    if (idx.length === 0) {
      await queryRunner.query(
        `CREATE INDEX \`idx_obs_cms_sections_lookup\` ON \`obs_cms_sections\` (\`observatory\`, \`pageSlug\`, \`sectionKey\`)`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tbl = await queryRunner.query(`SHOW TABLES LIKE 'obs_cms_sections'`);
    if (tbl.length === 0) return;

    const idx = await queryRunner.query(
      `SHOW INDEX FROM \`obs_cms_sections\` WHERE Key_name = 'idx_obs_cms_sections_lookup'`,
    );
    if (idx.length > 0) {
      await queryRunner.query(`DROP INDEX \`idx_obs_cms_sections_lookup\` ON \`obs_cms_sections\``);
    }

    const cols = await queryRunner.query(
      `SHOW COLUMNS FROM \`obs_cms_sections\` LIKE 'observatory'`,
    );
    if (cols.length > 0) {
      await queryRunner.query(`ALTER TABLE \`obs_cms_sections\` DROP COLUMN \`observatory\``);
    }
  }
}
