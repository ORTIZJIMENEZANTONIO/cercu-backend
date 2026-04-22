import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVisibleArchivadoToGreenRoofTables1716000000000 implements MigrationInterface {
  name = 'AddVisibleArchivadoToGreenRoofTables1716000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── obs_green_roofs ──
    const grVisible = await queryRunner.query(`SHOW COLUMNS FROM obs_green_roofs LIKE 'visible'`);
    if (grVisible.length === 0) {
      await queryRunner.query(`ALTER TABLE obs_green_roofs ADD COLUMN visible BOOLEAN DEFAULT true`);
      await queryRunner.query(`ALTER TABLE obs_green_roofs ADD COLUMN archivado BOOLEAN DEFAULT false`);
    }

    // ── obs_candidate_roofs ──
    const crVisible = await queryRunner.query(`SHOW COLUMNS FROM obs_candidate_roofs LIKE 'visible'`);
    if (crVisible.length === 0) {
      await queryRunner.query(`ALTER TABLE obs_candidate_roofs ADD COLUMN visible BOOLEAN DEFAULT true`);
      await queryRunner.query(`ALTER TABLE obs_candidate_roofs ADD COLUMN archivado BOOLEAN DEFAULT false`);
    }

    // ── obs_validation_records ──
    const vrVisible = await queryRunner.query(`SHOW COLUMNS FROM obs_validation_records LIKE 'visible'`);
    if (vrVisible.length === 0) {
      await queryRunner.query(`ALTER TABLE obs_validation_records ADD COLUMN visible BOOLEAN DEFAULT true`);
      await queryRunner.query(`ALTER TABLE obs_validation_records ADD COLUMN archivado BOOLEAN DEFAULT false`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE obs_validation_records DROP COLUMN archivado`);
    await queryRunner.query(`ALTER TABLE obs_validation_records DROP COLUMN visible`);
    await queryRunner.query(`ALTER TABLE obs_candidate_roofs DROP COLUMN archivado`);
    await queryRunner.query(`ALTER TABLE obs_candidate_roofs DROP COLUMN visible`);
    await queryRunner.query(`ALTER TABLE obs_green_roofs DROP COLUMN archivado`);
    await queryRunner.query(`ALTER TABLE obs_green_roofs DROP COLUMN visible`);
  }
}
