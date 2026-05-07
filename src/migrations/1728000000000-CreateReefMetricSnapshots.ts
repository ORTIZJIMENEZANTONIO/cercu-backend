import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crea `obs_reef_metric_snapshots`: serie de tiempo de los indicadores por
 * arrecife. Cada fila es el estado en un día concreto (capturedAt). La unicidad
 * (reefId, capturedAt) se garantiza vía UNIQUE INDEX para que el upsert por
 * fecha sea seguro entre llamadas concurrentes del scheduler / botón manual.
 *
 * Idempotente: chequea con `SHOW TABLES LIKE` antes de crear.
 */
export class CreateReefMetricSnapshots1728000000000 implements MigrationInterface {
  name = 'CreateReefMetricSnapshots1728000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tbl = await queryRunner.query(
      `SHOW TABLES LIKE 'obs_reef_metric_snapshots'`,
    );
    if (tbl.length === 0) {
      await queryRunner.query(`
        CREATE TABLE \`obs_reef_metric_snapshots\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`reefId\` int NOT NULL,
          \`capturedAt\` date NOT NULL,
          \`liveCoralCover\` decimal(5,2) NULL,
          \`dhw\` decimal(5,2) NULL,
          \`sst\` decimal(5,2) NULL,
          \`sstAnomaly\` decimal(5,2) NULL,
          \`observationsCount\` int NOT NULL DEFAULT 0,
          \`healthIndex\` decimal(5,2) NULL,
          \`source\` varchar(16) NOT NULL DEFAULT 'manual',
          \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          UNIQUE INDEX \`UQ_reef_snapshot_reef_date\` (\`reefId\`, \`capturedAt\`),
          INDEX \`IDX_reef_snapshot_reef_captured\` (\`reefId\`, \`capturedAt\`),
          CONSTRAINT \`FK_reef_snapshot_reef\` FOREIGN KEY (\`reefId\`)
            REFERENCES \`obs_reefs\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tbl = await queryRunner.query(
      `SHOW TABLES LIKE 'obs_reef_metric_snapshots'`,
    );
    if (tbl.length > 0) {
      await queryRunner.query(`DROP TABLE \`obs_reef_metric_snapshots\``);
    }
  }
}
