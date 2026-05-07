import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Asegura que las tablas y columnas necesarias para el scraper de notihumedal
 * existan en producción. Auto-sync TypeORM las creó en dev pero el VPS las
 * necesita explícitas:
 *
 * 1) `obs_prospecto_noticias` — cola de candidatos scrapeados desde mongabay.
 *    Tiene `urlHash UNIQUE` para deduplicar entre corridas del scraper.
 * 2) `obs_notihumedal.css_content` y `editor_data` — campos del editor
 *    inline-block, presentes en el entity desde hace tiempo pero nunca
 *    migrados.
 *
 * Idempotente: chequea con SHOW TABLES / SHOW COLUMNS antes de cada DDL.
 */
export class EnsureNotihumedalScraperTables1727000000000
  implements MigrationInterface
{
  name = 'EnsureNotihumedalScraperTables1727000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) obs_prospecto_noticias
    const tbl = await queryRunner.query(
      `SHOW TABLES LIKE 'obs_prospecto_noticias'`,
    );
    if (tbl.length === 0) {
      await queryRunner.query(`
        CREATE TABLE \`obs_prospecto_noticias\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`titulo\` varchar(255) NOT NULL,
          \`resumen\` text NOT NULL,
          \`url\` varchar(500) NOT NULL,
          \`fuente\` varchar(100) NOT NULL,
          \`fecha\` varchar(20) NOT NULL,
          \`estado\` varchar(50) NOT NULL DEFAULT 'pendiente',
          \`notasRechazo\` text NULL,
          \`urlHash\` varchar(64) NOT NULL,
          \`reviewedBy\` varchar(100) NULL,
          \`fechaScraping\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          UNIQUE INDEX \`UQ_obs_prospecto_url_hash\` (\`urlHash\`),
          INDEX \`IDX_obs_prospecto_estado\` (\`estado\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }

    // 2) obs_notihumedal.css_content
    const cssCol = await queryRunner.query(
      `SHOW COLUMNS FROM \`obs_notihumedal\` LIKE 'css_content'`,
    );
    if (cssCol.length === 0) {
      await queryRunner.query(
        `ALTER TABLE \`obs_notihumedal\` ADD COLUMN \`css_content\` text NULL`,
      );
    }

    // 3) obs_notihumedal.editor_data
    const editorCol = await queryRunner.query(
      `SHOW COLUMNS FROM \`obs_notihumedal\` LIKE 'editor_data'`,
    );
    if (editorCol.length === 0) {
      await queryRunner.query(
        `ALTER TABLE \`obs_notihumedal\` ADD COLUMN \`editor_data\` json NULL`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const editorCol = await queryRunner.query(
      `SHOW COLUMNS FROM \`obs_notihumedal\` LIKE 'editor_data'`,
    );
    if (editorCol.length > 0) {
      await queryRunner.query(
        `ALTER TABLE \`obs_notihumedal\` DROP COLUMN \`editor_data\``,
      );
    }
    const cssCol = await queryRunner.query(
      `SHOW COLUMNS FROM \`obs_notihumedal\` LIKE 'css_content'`,
    );
    if (cssCol.length > 0) {
      await queryRunner.query(
        `ALTER TABLE \`obs_notihumedal\` DROP COLUMN \`css_content\``,
      );
    }
    const tbl = await queryRunner.query(
      `SHOW TABLES LIKE 'obs_prospecto_noticias'`,
    );
    if (tbl.length > 0) {
      await queryRunner.query(`DROP TABLE \`obs_prospecto_noticias\``);
    }
  }
}
