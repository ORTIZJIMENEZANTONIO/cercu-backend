import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crea las tablas obs_techos_verdes_tiers y obs_techos_verdes_contributors
 * para el Observatorio de Techos Verdes. Tablas separadas de las de
 * arrecifes (obs_tiers/obs_contributors) y humedales
 * (obs_humedales_tiers/obs_humedales_contributors).
 *
 * No vuelve a tocar obs_prospect_submissions.contributorId — esa columna
 * ya fue añadida por la migración 1738 y se reutiliza aqui (la columna
 * referenciara obs_techos_verdes_contributors.id cuando observatory='techos-verdes').
 *
 * Idempotente via SHOW TABLES LIKE.
 */
export class CreateTechosVerdesTiersAndContributors1739000000000 implements MigrationInterface {
  name = 'CreateTechosVerdesTiersAndContributors1739000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tiersExists = await queryRunner.query(
      `SHOW TABLES LIKE 'obs_techos_verdes_tiers'`
    );
    if (tiersExists.length === 0) {
      await queryRunner.query(`
        CREATE TABLE obs_techos_verdes_tiers (
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
          INDEX idx_techos_tiers_sort (sortOrder),
          INDEX idx_techos_tiers_visible (visible)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('  obs_techos_verdes_tiers table created');
    }

    const contributorsExists = await queryRunner.query(
      `SHOW TABLES LIKE 'obs_techos_verdes_contributors'`
    );
    if (contributorsExists.length === 0) {
      await queryRunner.query(`
        CREATE TABLE obs_techos_verdes_contributors (
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
          INDEX idx_techos_contributors_tier (tier),
          INDEX idx_techos_contributors_visible (visible),
          INDEX idx_techos_contributors_role (role)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('  obs_techos_verdes_contributors table created');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS obs_techos_verdes_contributors`);
    await queryRunner.query(`DROP TABLE IF EXISTS obs_techos_verdes_tiers`);
  }
}
