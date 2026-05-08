import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crea las tablas obs_humedales_tiers y obs_humedales_contributors
 * para el Observatorio de Humedales. Tablas separadas de las de
 * arrecifes (obs_tiers, obs_contributors) para evitar colisiones de
 * slugs/handles y permitir vocabulario propio del dominio (humedales
 * artificiales) sin acoplar ambos observatorios.
 *
 * Idempotente via SHOW TABLES LIKE.
 */
export class CreateHumedalTiersAndContributors1738000000000 implements MigrationInterface {
  name = 'CreateHumedalTiersAndContributors1738000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tiersExists = await queryRunner.query(
      `SHOW TABLES LIKE 'obs_humedales_tiers'`
    );
    if (tiersExists.length === 0) {
      await queryRunner.query(`
        CREATE TABLE obs_humedales_tiers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          slug VARCHAR(50) NOT NULL UNIQUE,
          label VARCHAR(100) NOT NULL,
          description TEXT NULL,
          minScore INT NOT NULL DEFAULT 0,
          maxScore INT NULL,
          color VARCHAR(30) NOT NULL DEFAULT 'slate',
          requirements TEXT NULL,
          icon VARCHAR(100) NULL,
          sortOrder INT NOT NULL DEFAULT 0,
          visible BOOLEAN NOT NULL DEFAULT TRUE,
          archived BOOLEAN NOT NULL DEFAULT FALSE,
          modeTitle VARCHAR(150) NULL,
          audience TEXT NULL,
          contributions JSON NULL,
          bridge TEXT NULL,
          createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          updatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          INDEX idx_humedales_tiers_sort (sortOrder),
          INDEX idx_humedales_tiers_visible (visible)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('  obs_humedales_tiers table created');
    }

    const contributorsExists = await queryRunner.query(
      `SHOW TABLES LIKE 'obs_humedales_contributors'`
    );
    if (contributorsExists.length === 0) {
      await queryRunner.query(`
        CREATE TABLE obs_humedales_contributors (
          id INT AUTO_INCREMENT PRIMARY KEY,
          displayName VARCHAR(150) NOT NULL,
          handle VARCHAR(80) NOT NULL UNIQUE,
          role VARCHAR(30) NOT NULL DEFAULT 'ciudadano',
          affiliation VARCHAR(200) NULL,
          bio TEXT NULL,
          avatarUrl VARCHAR(500) NULL,
          alcaldia VARCHAR(100) NULL,
          joinedAt DATE NULL,
          tier VARCHAR(50) NOT NULL DEFAULT 'aprendiz',
          reputationScore INT NOT NULL DEFAULT 0,
          validatedContributions INT NOT NULL DEFAULT 0,
          rejectedContributions INT NOT NULL DEFAULT 0,
          acceptanceRate DECIMAL(4,3) NOT NULL DEFAULT 0,
          averageQuality DECIMAL(5,2) NOT NULL DEFAULT 0,
          consecutiveMonthsActive INT NOT NULL DEFAULT 0,
          badges JSON NULL,
          publicProfile BOOLEAN NOT NULL DEFAULT TRUE,
          verified BOOLEAN NOT NULL DEFAULT FALSE,
          visible BOOLEAN NOT NULL DEFAULT TRUE,
          archived BOOLEAN NOT NULL DEFAULT FALSE,
          createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          updatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          INDEX idx_humedales_contributors_tier (tier),
          INDEX idx_humedales_contributors_visible (visible),
          INDEX idx_humedales_contributors_role (role)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('  obs_humedales_contributors table created');
    }

    // Anadir contributorId a obs_prospect_submissions para atribuir prospectos.
    const psCols = await queryRunner.query(`SHOW COLUMNS FROM obs_prospect_submissions LIKE 'contributorId'`);
    if (psCols.length === 0) {
      await queryRunner.query(`
        ALTER TABLE obs_prospect_submissions
        ADD COLUMN contributorId INT NULL,
        ADD INDEX idx_prospect_contributor (contributorId)
      `);
      console.log('  obs_prospect_submissions.contributorId added');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const psCols = await queryRunner.query(`SHOW COLUMNS FROM obs_prospect_submissions LIKE 'contributorId'`);
    if (psCols.length > 0) {
      await queryRunner.query(`
        ALTER TABLE obs_prospect_submissions
        DROP INDEX idx_prospect_contributor,
        DROP COLUMN contributorId
      `);
    }
    await queryRunner.query(`DROP TABLE IF EXISTS obs_humedales_contributors`);
    await queryRunner.query(`DROP TABLE IF EXISTS obs_humedales_tiers`);
  }
}
