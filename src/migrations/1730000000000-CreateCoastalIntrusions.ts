import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crea `obs_coastal_intrusions`: cola de candidatos a invasión de zona
 * federal detectados automáticamente por el módulo coastal-intrusion.
 *
 * FK→`obs_reefs` ON DELETE SET NULL para no perder el histórico cuando se
 * archive un arrecife. UNIQUE compuesto (reefId, osmId) garantiza dedup
 * entre corridas del detector — el mismo edificio OSM en el mismo reef no
 * se inserta dos veces.
 *
 * Idempotente: chequea con SHOW TABLES LIKE.
 */
export class CreateCoastalIntrusions1730000000000 implements MigrationInterface {
  name = 'CreateCoastalIntrusions1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tbl = await queryRunner.query(
      `SHOW TABLES LIKE 'obs_coastal_intrusions'`,
    );
    if (tbl.length === 0) {
      await queryRunner.query(`
        CREATE TABLE \`obs_coastal_intrusions\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`reefId\` int NULL,
          \`osmId\` varchar(64) NULL,
          \`osmTags\` json NULL,
          \`geometry\` json NOT NULL,
          \`centroidLat\` decimal(10,7) NOT NULL,
          \`centroidLng\` decimal(10,7) NOT NULL,
          \`areaM2\` decimal(12,2) NULL,
          \`zofematOverlapPct\` decimal(8,2) NULL,
          \`status\` varchar(32) NOT NULL,
          \`source\` varchar(32) NOT NULL DEFAULT 'osm_buffer_zofemat',
          \`detectedAt\` datetime NOT NULL,
          \`reviewedBy\` varchar(100) NULL,
          \`reviewedAt\` datetime NULL,
          \`reviewerNotes\` text NULL,
          \`escalatedConflictId\` int NULL,
          \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          UNIQUE INDEX \`UQ_intrusion_reef_osm\` (\`reefId\`, \`osmId\`),
          INDEX \`IDX_intrusion_status\` (\`status\`),
          INDEX \`IDX_intrusion_reef_status\` (\`reefId\`, \`status\`),
          CONSTRAINT \`FK_intrusion_reef\` FOREIGN KEY (\`reefId\`)
            REFERENCES \`obs_reefs\` (\`id\`) ON DELETE SET NULL,
          CONSTRAINT \`FK_intrusion_conflict\` FOREIGN KEY (\`escalatedConflictId\`)
            REFERENCES \`obs_conflicts\` (\`id\`) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tbl = await queryRunner.query(
      `SHOW TABLES LIKE 'obs_coastal_intrusions'`,
    );
    if (tbl.length > 0) {
      await queryRunner.query(`DROP TABLE \`obs_coastal_intrusions\``);
    }
  }
}
