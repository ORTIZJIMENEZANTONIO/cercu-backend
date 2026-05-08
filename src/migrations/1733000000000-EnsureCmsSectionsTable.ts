import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Asegura que `obs_cms_sections` exista. La entidad `ObsCmsSection` se creó
 * hace mucho tiempo cuando el proyecto corría con `synchronize: true` y
 * nunca se generó una migración explícita — la tabla sólo existe en
 * ambientes que tuvieron auto-sync activo en algún momento.
 *
 * Esta migración cierra esa brecha para que un VPS provisionado desde cero
 * con `npm run migration:run` (sin auto-sync) tenga el schema completo.
 *
 * Idempotente: chequea con `SHOW TABLES LIKE` antes de crear.
 */
export class EnsureCmsSectionsTable1733000000000 implements MigrationInterface {
  name = 'EnsureCmsSectionsTable1733000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tbl = await queryRunner.query(
      `SHOW TABLES LIKE 'obs_cms_sections'`,
    );
    if (tbl.length === 0) {
      await queryRunner.query(`
        CREATE TABLE \`obs_cms_sections\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`pageSlug\` varchar(50) NOT NULL,
          \`sectionKey\` varchar(50) NOT NULL,
          \`items\` json NOT NULL,
          \`updatedBy\` varchar(100) NULL,
          \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          INDEX \`IDX_cms_sections_page_section\` (\`pageSlug\`, \`sectionKey\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tbl = await queryRunner.query(
      `SHOW TABLES LIKE 'obs_cms_sections'`,
    );
    if (tbl.length > 0) {
      await queryRunner.query(`DROP TABLE \`obs_cms_sections\``);
    }
  }
}
