import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crea las tablas `obs_layers` (catálogo de capas + uploads) y `obs_tiers`
 * (escalas / modos de participación de la red) y agrega la columna
 * `geometry` (json GeoJSON) a `obs_conflicts`.
 *
 * Idempotente: chequea existencia previa con `SHOW TABLES LIKE` y
 * `SHOW COLUMNS LIKE` antes de cada DDL — convive con auto-sync de TypeORM
 * en dev sin romper.
 *
 * Notas:
 * · `obs_layers.slug` y `obs_tiers.slug` son únicos. Sólo se crea el índice
 *   UNIQUE — sin un INDEX duplicado, para evitar el bug de TypeORM
 *   "Duplicate key name" cuando se combinan @Column({ unique: true }) + @Index().
 * · `obs_conflicts.geometry` acepta GeoJSON Point/LineString/Polygon/Multi*.
 *   El service valida el shape; aquí sólo guardamos el JSON.
 */
export class AddLayersTiersAndConflictGeometry1724000000000 implements MigrationInterface {
  name = 'AddLayersTiersAndConflictGeometry1724000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── obs_layers ─────────────────────────────────────────────────────────
    const layersExists = await queryRunner.query(`SHOW TABLES LIKE 'obs_layers'`);
    if (layersExists.length === 0) {
      await queryRunner.query(`
        CREATE TABLE \`obs_layers\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`slug\` varchar(100) NOT NULL,
          \`title\` varchar(255) NOT NULL,
          \`description\` text NULL,
          \`kind\` varchar(20) NOT NULL DEFAULT 'external_url',
          \`provider\` varchar(50) NOT NULL,
          \`providerLabel\` varchar(100) NOT NULL,
          \`category\` varchar(50) NOT NULL,
          \`format\` varchar(20) NOT NULL,
          \`resolution\` varchar(50) NULL,
          \`cadence\` varchar(50) NULL,
          \`coverage\` varchar(20) NOT NULL DEFAULT 'regional',
          \`license\` varchar(100) NOT NULL,
          \`attribution\` text NOT NULL,
          \`sourceUrl\` text NULL,
          \`downloadUrl\` text NULL,
          \`previewUrl\` text NULL,
          \`wmsUrl\` text NULL,
          \`wmsLayerName\` varchar(200) NULL,
          \`tileUrlPattern\` text NULL,
          \`overlayOpacity\` decimal(3,2) NOT NULL DEFAULT '0.70',
          \`fileName\` varchar(255) NULL,
          \`filePath\` varchar(500) NULL,
          \`fileSize\` bigint NULL,
          \`mimeType\` varchar(100) NULL,
          \`lastUpdated\` date NULL,
          \`active\` tinyint(1) NOT NULL DEFAULT 1,
          \`visible\` tinyint(1) NOT NULL DEFAULT 1,
          \`archived\` tinyint(1) NOT NULL DEFAULT 0,
          \`sortOrder\` int NOT NULL DEFAULT 0,
          \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          UNIQUE INDEX \`UQ_obs_layers_slug\` (\`slug\`),
          INDEX \`IDX_obs_layers_kind\` (\`kind\`),
          INDEX \`IDX_obs_layers_category\` (\`category\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }

    // ── obs_tiers ──────────────────────────────────────────────────────────
    const tiersExists = await queryRunner.query(`SHOW TABLES LIKE 'obs_tiers'`);
    if (tiersExists.length === 0) {
      await queryRunner.query(`
        CREATE TABLE \`obs_tiers\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`slug\` varchar(50) NOT NULL,
          \`label\` varchar(100) NOT NULL,
          \`description\` text NULL,
          \`minScore\` int NOT NULL DEFAULT 0,
          \`maxScore\` int NULL,
          \`color\` varchar(30) NOT NULL DEFAULT 'slate',
          \`requirements\` text NULL,
          \`icon\` varchar(100) NULL,
          \`sortOrder\` int NOT NULL DEFAULT 0,
          \`visible\` tinyint(1) NOT NULL DEFAULT 1,
          \`archived\` tinyint(1) NOT NULL DEFAULT 0,
          \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          UNIQUE INDEX \`UQ_obs_tiers_slug\` (\`slug\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }

    // ── obs_conflicts.geometry ────────────────────────────────────────────
    // GeoJSON nativo (Point/LineString/Polygon/Multi*). Ubica al conflicto en
    // el mapa cuando no se quiere depender únicamente de `reefIds`.
    const conflictsTable = await queryRunner.query(`SHOW TABLES LIKE 'obs_conflicts'`);
    if (conflictsTable.length > 0) {
      const geomCol = await queryRunner.query(
        `SHOW COLUMNS FROM \`obs_conflicts\` LIKE 'geometry'`,
      );
      if (geomCol.length === 0) {
        await queryRunner.query(
          `ALTER TABLE \`obs_conflicts\` ADD COLUMN \`geometry\` json NULL AFTER \`mediaUrls\``,
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop en orden inverso (geometry → tiers → layers).
    const conflictsTable = await queryRunner.query(`SHOW TABLES LIKE 'obs_conflicts'`);
    if (conflictsTable.length > 0) {
      const geomCol = await queryRunner.query(
        `SHOW COLUMNS FROM \`obs_conflicts\` LIKE 'geometry'`,
      );
      if (geomCol.length > 0) {
        await queryRunner.query(`ALTER TABLE \`obs_conflicts\` DROP COLUMN \`geometry\``);
      }
    }

    const tiersExists = await queryRunner.query(`SHOW TABLES LIKE 'obs_tiers'`);
    if (tiersExists.length > 0) {
      await queryRunner.query(`DROP TABLE \`obs_tiers\``);
    }

    const layersExists = await queryRunner.query(`SHOW TABLES LIKE 'obs_layers'`);
    if (layersExists.length > 0) {
      await queryRunner.query(`DROP TABLE \`obs_layers\``);
    }
  }
}
