import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Asegura que `obs_prospect_submissions` exista. Misma situación que
 * `obs_cms_sections`: la entidad `ProspectSubmission` se creó hace tiempo
 * con `synchronize: true` y nunca tuvo migración explícita.
 *
 * Esta tabla es la cola compartida de prospectos para los observatorios
 * de techos-verdes y humedales (NO arrecifes — arrecifes tiene su propia
 * cola de aportes en `obs_observations` y noticias en
 * `obs_reef_news_prospects`).
 *
 * Campos:
 *   - observatory: 'techos-verdes' | 'humedales'
 *   - status: 'pendiente' | 'aprobado' | 'rechazado'
 *   - data: payload JSON flexible del prospecto
 *   - source: 'ia_detector' | 'manual' | 'externo'
 *
 * Idempotente.
 */
export class EnsureProspectSubmissionsTable1734000000000 implements MigrationInterface {
  name = 'EnsureProspectSubmissionsTable1734000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tbl = await queryRunner.query(
      `SHOW TABLES LIKE 'obs_prospect_submissions'`,
    );
    if (tbl.length === 0) {
      await queryRunner.query(`
        CREATE TABLE \`obs_prospect_submissions\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`observatory\` varchar(50) NOT NULL,
          \`status\` varchar(50) NOT NULL DEFAULT 'pendiente',
          \`data\` json NOT NULL,
          \`source\` varchar(100) NULL,
          \`confianzaDetector\` varchar(100) NULL,
          \`notasAdmin\` text NULL,
          \`reviewedBy\` varchar(255) NULL,
          \`reviewedAt\` datetime NULL,
          \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          INDEX \`IDX_prospect_obs_status\` (\`observatory\`, \`status\`),
          INDEX \`IDX_prospect_created\` (\`createdAt\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tbl = await queryRunner.query(
      `SHOW TABLES LIKE 'obs_prospect_submissions'`,
    );
    if (tbl.length > 0) {
      await queryRunner.query(`DROP TABLE \`obs_prospect_submissions\``);
    }
  }
}
