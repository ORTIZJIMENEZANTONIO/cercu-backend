import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Dos cambios para soportar `/admin/analytics`:
 *
 * 1) Columnas `climateData` (json) + `climateFetchedAt` (datetime) en `obs_reefs`
 *    para cachear la climatología NASA POWER por arrecife (ver
 *    `modules/observatory/arrecifes/nasaPower.service.ts`).
 *
 * 2) Tabla `observatory_interaction_events` para tracking anónimo de uso
 *    (compartida por los 3 frontends: arrecifes / humedales / techos-verdes).
 *    Alimenta `GET /:observatory/admin/analytics/summary`.
 *
 * Idempotente: chequea existencia previa con `SHOW COLUMNS LIKE` /
 * `SHOW TABLES LIKE`. Auto-sync (dev) puede haberlo creado ya — la migración
 * sólo crea lo que falta.
 */
export class AddClimateAndInteractionEvents1725000000000 implements MigrationInterface {
  name = 'AddClimateAndInteractionEvents1725000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) climateData en obs_reefs
    const climateCol = await queryRunner.query(
      `SHOW COLUMNS FROM \`obs_reefs\` LIKE 'climateData'`,
    );
    if (climateCol.length === 0) {
      await queryRunner.query(
        `ALTER TABLE \`obs_reefs\` ADD COLUMN \`climateData\` json NULL AFTER \`archived\``,
      );
    }

    // 2) climateFetchedAt en obs_reefs
    const fetchedAtCol = await queryRunner.query(
      `SHOW COLUMNS FROM \`obs_reefs\` LIKE 'climateFetchedAt'`,
    );
    if (fetchedAtCol.length === 0) {
      await queryRunner.query(
        `ALTER TABLE \`obs_reefs\` ADD COLUMN \`climateFetchedAt\` datetime NULL AFTER \`climateData\``,
      );
    }

    // 3) tabla observatory_interaction_events (tracking + analytics)
    const tbl = await queryRunner.query(
      `SHOW TABLES LIKE 'observatory_interaction_events'`,
    );
    if (tbl.length === 0) {
      await queryRunner.query(`
        CREATE TABLE \`observatory_interaction_events\` (
          \`id\` bigint NOT NULL AUTO_INCREMENT,
          \`observatory\` varchar(32) NOT NULL,
          \`eventType\` varchar(24) NOT NULL,
          \`path\` varchar(255) NULL,
          \`target\` varchar(255) NULL,
          \`sessionId\` varchar(64) NOT NULL,
          \`userId\` varchar(64) NULL,
          \`metadata\` json NULL,
          \`referrer\` varchar(255) NULL,
          \`userAgent\` varchar(255) NULL,
          \`ipHash\` varchar(64) NULL,
          \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          INDEX \`IDX_obs_events_obs_created\` (\`observatory\`, \`createdAt\`),
          INDEX \`IDX_obs_events_obs_type_created\` (\`observatory\`, \`eventType\`, \`createdAt\`),
          INDEX \`IDX_obs_events_obs_session\` (\`observatory\`, \`sessionId\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tbl = await queryRunner.query(
      `SHOW TABLES LIKE 'observatory_interaction_events'`,
    );
    if (tbl.length > 0) {
      await queryRunner.query(`DROP TABLE \`observatory_interaction_events\``);
    }

    const fetchedAtCol = await queryRunner.query(
      `SHOW COLUMNS FROM \`obs_reefs\` LIKE 'climateFetchedAt'`,
    );
    if (fetchedAtCol.length > 0) {
      await queryRunner.query(
        `ALTER TABLE \`obs_reefs\` DROP COLUMN \`climateFetchedAt\``,
      );
    }

    const climateCol = await queryRunner.query(
      `SHOW COLUMNS FROM \`obs_reefs\` LIKE 'climateData'`,
    );
    if (climateCol.length > 0) {
      await queryRunner.query(
        `ALTER TABLE \`obs_reefs\` DROP COLUMN \`climateData\``,
      );
    }
  }
}
