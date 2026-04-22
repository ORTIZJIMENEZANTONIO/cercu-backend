import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVisibleArchivadoFields1714000000000 implements MigrationInterface {
  name = 'AddVisibleArchivadoFields1714000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── obs_humedales: add visible + archivado ──
    const humedalVisible = await queryRunner.query(`SHOW COLUMNS FROM obs_humedales LIKE 'visible'`);
    if (humedalVisible.length === 0) {
      await queryRunner.query(`ALTER TABLE obs_humedales ADD COLUMN visible BOOLEAN DEFAULT true`);
      await queryRunner.query(`ALTER TABLE obs_humedales ADD COLUMN archivado BOOLEAN DEFAULT false`);
    }

    // ── obs_hallazgos: add visible + archivado ──
    const hallazgoVisible = await queryRunner.query(`SHOW COLUMNS FROM obs_hallazgos LIKE 'visible'`);
    if (hallazgoVisible.length === 0) {
      await queryRunner.query(`ALTER TABLE obs_hallazgos ADD COLUMN visible BOOLEAN DEFAULT true`);
      await queryRunner.query(`ALTER TABLE obs_hallazgos ADD COLUMN archivado BOOLEAN DEFAULT false`);
    }

    // ── obs_notihumedal: add visible + archivado + url + fuente ──
    const notiVisible = await queryRunner.query(`SHOW COLUMNS FROM obs_notihumedal LIKE 'visible'`);
    if (notiVisible.length === 0) {
      await queryRunner.query(`ALTER TABLE obs_notihumedal ADD COLUMN visible BOOLEAN DEFAULT true`);
      await queryRunner.query(`ALTER TABLE obs_notihumedal ADD COLUMN archivado BOOLEAN DEFAULT false`);
    }

    const notiUrl = await queryRunner.query(`SHOW COLUMNS FROM obs_notihumedal LIKE 'url'`);
    if (notiUrl.length === 0) {
      await queryRunner.query(`ALTER TABLE obs_notihumedal ADD COLUMN url VARCHAR(500) NULL`);
    }

    const notiFuente = await queryRunner.query(`SHOW COLUMNS FROM obs_notihumedal LIKE 'fuente'`);
    if (notiFuente.length === 0) {
      await queryRunner.query(`ALTER TABLE obs_notihumedal ADD COLUMN fuente VARCHAR(500) NULL`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns from obs_notihumedal
    await queryRunner.query(`ALTER TABLE obs_notihumedal DROP COLUMN fuente`);
    await queryRunner.query(`ALTER TABLE obs_notihumedal DROP COLUMN url`);
    await queryRunner.query(`ALTER TABLE obs_notihumedal DROP COLUMN archivado`);
    await queryRunner.query(`ALTER TABLE obs_notihumedal DROP COLUMN visible`);

    // Remove columns from obs_hallazgos
    await queryRunner.query(`ALTER TABLE obs_hallazgos DROP COLUMN archivado`);
    await queryRunner.query(`ALTER TABLE obs_hallazgos DROP COLUMN visible`);

    // Remove columns from obs_humedales
    await queryRunner.query(`ALTER TABLE obs_humedales DROP COLUMN archivado`);
    await queryRunner.query(`ALTER TABLE obs_humedales DROP COLUMN visible`);
  }
}
