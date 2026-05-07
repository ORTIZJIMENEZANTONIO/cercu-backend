import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crea las dos tablas que soportan la sección de noticias del observatorio
 * de arrecifes: `obs_reef_news` (artículos publicados) y
 * `obs_reef_news_prospects` (cola de candidatos scrapeados).
 *
 * Convención inglesa de identificadores (consistente con el resto del módulo
 * arrecifes; el observatorio de humedales usa equivalentes en español).
 *
 * Idempotente: chequea con `SHOW TABLES LIKE` antes de crear.
 */
export class CreateReefNewsAndProspects1729000000000 implements MigrationInterface {
  name = 'CreateReefNewsAndProspects1729000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const newsTbl = await queryRunner.query(
      `SHOW TABLES LIKE 'obs_reef_news'`,
    );
    if (newsTbl.length === 0) {
      await queryRunner.query(`
        CREATE TABLE \`obs_reef_news\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`title\` varchar(255) NOT NULL,
          \`slug\` varchar(255) NOT NULL,
          \`summary\` text NOT NULL,
          \`content\` longtext NULL,
          \`author\` varchar(150) NOT NULL,
          \`publishedAt\` varchar(20) NOT NULL,
          \`tags\` json NULL,
          \`image\` varchar(500) NULL,
          \`imageCredit\` varchar(255) NULL,
          \`sourceUrl\` varchar(500) NULL,
          \`source\` varchar(100) NULL,
          \`visible\` tinyint(1) NOT NULL DEFAULT 1,
          \`archived\` tinyint(1) NOT NULL DEFAULT 0,
          \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          UNIQUE INDEX \`UQ_reef_news_slug\` (\`slug\`),
          INDEX \`IDX_reef_news_published\` (\`publishedAt\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }

    const propTbl = await queryRunner.query(
      `SHOW TABLES LIKE 'obs_reef_news_prospects'`,
    );
    if (propTbl.length === 0) {
      await queryRunner.query(`
        CREATE TABLE \`obs_reef_news_prospects\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`title\` varchar(255) NOT NULL,
          \`summary\` text NOT NULL,
          \`url\` varchar(500) NOT NULL,
          \`source\` varchar(100) NOT NULL,
          \`publishedAt\` varchar(20) NOT NULL,
          \`image\` varchar(500) NULL,
          \`status\` varchar(50) NOT NULL DEFAULT 'pending',
          \`rejectionNotes\` text NULL,
          \`urlHash\` varchar(64) NOT NULL,
          \`reviewedBy\` varchar(100) NULL,
          \`scrapedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          UNIQUE INDEX \`UQ_reef_news_prospect_url_hash\` (\`urlHash\`),
          INDEX \`IDX_reef_news_prospect_status\` (\`status\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const propTbl = await queryRunner.query(
      `SHOW TABLES LIKE 'obs_reef_news_prospects'`,
    );
    if (propTbl.length > 0) {
      await queryRunner.query(`DROP TABLE \`obs_reef_news_prospects\``);
    }
    const newsTbl = await queryRunner.query(
      `SHOW TABLES LIKE 'obs_reef_news'`,
    );
    if (newsTbl.length > 0) {
      await queryRunner.query(`DROP TABLE \`obs_reef_news\``);
    }
  }
}
