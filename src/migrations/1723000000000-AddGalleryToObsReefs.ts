import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Agrega columna `gallery` (json nullable) a `obs_reefs` para almacenar hasta
 * 3 URLs adicionales por arrecife (drawer detalle / inventory).
 *
 * Idempotente: chequea primero si la columna ya existe (auto-sync TypeORM la
 * pudo haber añadido en dev).
 */
export class AddGalleryToObsReefs1723000000000 implements MigrationInterface {
  name = 'AddGalleryToObsReefs1723000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const col = await queryRunner.query(
      `SHOW COLUMNS FROM \`obs_reefs\` LIKE 'gallery'`,
    );
    if (col.length === 0) {
      await queryRunner.query(
        `ALTER TABLE \`obs_reefs\` ADD COLUMN \`gallery\` json NULL AFTER \`hero\``,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const col = await queryRunner.query(
      `SHOW COLUMNS FROM \`obs_reefs\` LIKE 'gallery'`,
    );
    if (col.length > 0) {
      await queryRunner.query(`ALTER TABLE \`obs_reefs\` DROP COLUMN \`gallery\``);
    }
  }
}
