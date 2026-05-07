import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Bases de datos antiguas de prod no tienen `isActive` ni `lastLogin` en
 * `observatory_admins` (el entity las añadió después y auto-sync está apagado
 * en prod). Sin estas columnas, el flujo de login revienta con
 * `ER_BAD_FIELD_ERROR: Unknown column 'ObservatoryAdmin.lastLogin'`.
 *
 * Idempotente: chequea cada columna con `SHOW COLUMNS LIKE` antes de añadirla.
 */
export class AddIsActiveAndLastLoginToObservatoryAdmins1726000000000
  implements MigrationInterface
{
  name = 'AddIsActiveAndLastLoginToObservatoryAdmins1726000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isActiveCol = await queryRunner.query(
      `SHOW COLUMNS FROM \`observatory_admins\` LIKE 'isActive'`,
    );
    if (isActiveCol.length === 0) {
      await queryRunner.query(
        `ALTER TABLE \`observatory_admins\`
         ADD COLUMN \`isActive\` tinyint(1) NOT NULL DEFAULT 1`,
      );
    }

    const lastLoginCol = await queryRunner.query(
      `SHOW COLUMNS FROM \`observatory_admins\` LIKE 'lastLogin'`,
    );
    if (lastLoginCol.length === 0) {
      await queryRunner.query(
        `ALTER TABLE \`observatory_admins\`
         ADD COLUMN \`lastLogin\` datetime NULL`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const lastLoginCol = await queryRunner.query(
      `SHOW COLUMNS FROM \`observatory_admins\` LIKE 'lastLogin'`,
    );
    if (lastLoginCol.length > 0) {
      await queryRunner.query(
        `ALTER TABLE \`observatory_admins\` DROP COLUMN \`lastLogin\``,
      );
    }

    const isActiveCol = await queryRunner.query(
      `SHOW COLUMNS FROM \`observatory_admins\` LIKE 'isActive'`,
    );
    if (isActiveCol.length > 0) {
      await queryRunner.query(
        `ALTER TABLE \`observatory_admins\` DROP COLUMN \`isActive\``,
      );
    }
  }
}
