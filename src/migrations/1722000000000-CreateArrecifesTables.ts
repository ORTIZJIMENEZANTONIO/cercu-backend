import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateArrecifesTables1722000000000 implements MigrationInterface {
  name = 'CreateArrecifesTables1722000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── obs_reefs ──
    const reefsExists = await queryRunner.query(`SHOW TABLES LIKE 'obs_reefs'`);
    if (reefsExists.length === 0) {
      await queryRunner.query(`
        CREATE TABLE \`obs_reefs\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`name\` varchar(255) NOT NULL,
          \`state\` varchar(100) NOT NULL,
          \`ocean\` varchar(30) NOT NULL,
          \`region\` varchar(200) NULL,
          \`benthicClasses\` json NULL,
          \`geomorphicClasses\` json NULL,
          \`area\` decimal(14,2) NULL,
          \`depthRange\` json NULL,
          \`protection\` varchar(30) NOT NULL DEFAULT 'unprotected',
          \`status\` varchar(20) NOT NULL DEFAULT 'healthy',
          \`liveCoralCover\` decimal(5,2) NULL,
          \`bleachingAlert\` varchar(20) NULL,
          \`speciesRichness\` int NULL,
          \`threats\` json NULL,
          \`observations\` int NOT NULL DEFAULT 0,
          \`lat\` decimal(10,7) NOT NULL,
          \`lng\` decimal(10,7) NOT NULL,
          \`description\` text NULL,
          \`hero\` varchar(500) NULL,
          \`imageCredit\` varchar(255) NULL,
          \`visible\` tinyint(1) NOT NULL DEFAULT 1,
          \`archived\` tinyint(1) NOT NULL DEFAULT 0,
          \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          INDEX \`IDX_obs_reefs_ocean\` (\`ocean\`),
          INDEX \`IDX_obs_reefs_status\` (\`status\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }

    // ── obs_contributors ──
    const contributorsExists = await queryRunner.query(`SHOW TABLES LIKE 'obs_contributors'`);
    if (contributorsExists.length === 0) {
      await queryRunner.query(`
        CREATE TABLE \`obs_contributors\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`displayName\` varchar(150) NOT NULL,
          \`handle\` varchar(80) NOT NULL,
          \`role\` varchar(30) NOT NULL DEFAULT 'citizen',
          \`affiliation\` varchar(200) NULL,
          \`bio\` text NULL,
          \`avatarUrl\` varchar(500) NULL,
          \`state\` varchar(100) NULL,
          \`joinedAt\` date NULL,
          \`tier\` varchar(20) NOT NULL DEFAULT 'bronze',
          \`reputationScore\` int NOT NULL DEFAULT 0,
          \`validatedContributions\` int NOT NULL DEFAULT 0,
          \`rejectedContributions\` int NOT NULL DEFAULT 0,
          \`acceptanceRate\` decimal(4,3) NOT NULL DEFAULT 0,
          \`averageQuality\` decimal(5,2) NOT NULL DEFAULT 0,
          \`consecutiveMonthsActive\` int NOT NULL DEFAULT 0,
          \`badges\` json NULL,
          \`publicProfile\` tinyint(1) NOT NULL DEFAULT 1,
          \`verified\` tinyint(1) NOT NULL DEFAULT 0,
          \`visible\` tinyint(1) NOT NULL DEFAULT 1,
          \`archived\` tinyint(1) NOT NULL DEFAULT 0,
          \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          UNIQUE INDEX \`IDX_obs_contributors_handle\` (\`handle\`),
          INDEX \`IDX_obs_contributors_tier\` (\`tier\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }

    // ── obs_conflicts ──
    const conflictsExists = await queryRunner.query(`SHOW TABLES LIKE 'obs_conflicts'`);
    if (conflictsExists.length === 0) {
      await queryRunner.query(`
        CREATE TABLE \`obs_conflicts\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`title\` varchar(255) NOT NULL,
          \`summary\` text NOT NULL,
          \`fullStory\` longtext NULL,
          \`reefIds\` json NULL,
          \`state\` varchar(100) NOT NULL,
          \`threats\` json NULL,
          \`intensity\` varchar(20) NOT NULL DEFAULT 'medium',
          \`status\` varchar(20) NOT NULL DEFAULT 'ongoing',
          \`affectedCommunities\` json NULL,
          \`affectedSpecies\` json NULL,
          \`startedAt\` date NULL,
          \`drivers\` json NULL,
          \`resistance\` json NULL,
          \`legalActions\` json NULL,
          \`mediaUrls\` json NULL,
          \`contributorId\` int NULL,
          \`visible\` tinyint(1) NOT NULL DEFAULT 1,
          \`archived\` tinyint(1) NOT NULL DEFAULT 0,
          \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          INDEX \`IDX_obs_conflicts_intensity\` (\`intensity\`),
          INDEX \`IDX_obs_conflicts_status\` (\`status\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }

    // ── obs_observations ──
    const observationsExists = await queryRunner.query(`SHOW TABLES LIKE 'obs_observations'`);
    if (observationsExists.length === 0) {
      await queryRunner.query(`
        CREATE TABLE \`obs_observations\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`reefId\` int NULL,
          \`type\` varchar(40) NOT NULL,
          \`title\` varchar(255) NOT NULL,
          \`description\` text NOT NULL,
          \`contributorId\` int NOT NULL,
          \`capturedAt\` datetime NOT NULL,
          \`submittedAt\` datetime NOT NULL,
          \`lat\` decimal(10,7) NOT NULL,
          \`lng\` decimal(10,7) NOT NULL,
          \`attachments\` json NULL,
          \`tags\` json NULL,
          \`status\` varchar(30) NOT NULL DEFAULT 'pending',
          \`reviewerId\` varchar(36) NULL,
          \`reviewerNotes\` text NULL,
          \`validatedAt\` datetime NULL,
          \`qualityScore\` int NULL,
          \`visible\` tinyint(1) NOT NULL DEFAULT 1,
          \`archived\` tinyint(1) NOT NULL DEFAULT 0,
          \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          INDEX \`IDX_obs_observations_reefId\` (\`reefId\`),
          INDEX \`IDX_obs_observations_type\` (\`type\`),
          INDEX \`IDX_obs_observations_contributorId\` (\`contributorId\`),
          INDEX \`IDX_obs_observations_status\` (\`status\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }

    // ── obs_bleaching_alerts ──
    const bleachingExists = await queryRunner.query(`SHOW TABLES LIKE 'obs_bleaching_alerts'`);
    if (bleachingExists.length === 0) {
      await queryRunner.query(`
        CREATE TABLE \`obs_bleaching_alerts\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`reefId\` int NOT NULL,
          \`level\` varchar(20) NOT NULL,
          \`dhw\` decimal(6,2) NULL,
          \`sst\` decimal(5,2) NULL,
          \`sstAnomaly\` decimal(5,2) NULL,
          \`observedAt\` datetime NOT NULL,
          \`source\` varchar(30) NOT NULL DEFAULT 'noaa_crw',
          \`productUrl\` varchar(500) NULL,
          \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          INDEX \`IDX_obs_bleaching_alerts_reef_observed\` (\`reefId\`, \`observedAt\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`obs_bleaching_alerts\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`obs_observations\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`obs_conflicts\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`obs_contributors\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`obs_reefs\``);
  }
}
