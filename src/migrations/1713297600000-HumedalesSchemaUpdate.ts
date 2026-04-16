import { MigrationInterface, QueryRunner } from 'typeorm';

export class HumedalesSchemaUpdate1713297600000 implements MigrationInterface {
  name = 'HumedalesSchemaUpdate1713297600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── observatory_admins: add role + permissions ──
    const adminCols = await queryRunner.query(`SHOW COLUMNS FROM observatory_admins LIKE 'role'`);
    if (adminCols.length === 0) {
      await queryRunner.query(`ALTER TABLE observatory_admins ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'superadmin'`);
      await queryRunner.query(`ALTER TABLE observatory_admins ADD COLUMN permissions JSON NULL`);
      // Set existing admins as superadmin with all permissions (preserves current access)
      await queryRunner.query(`UPDATE observatory_admins SET role = 'superadmin', permissions = '["manage_users","manage_cms","manage_humedales","manage_hallazgos","manage_notihumedal","manage_prospectos"]' WHERE role = 'superadmin'`);
    }

    // ── obs_humedales: add fuente, fuenteImagen, tipoVegetacion; make funcionPrincipal TEXT ──
    const humedalCols = await queryRunner.query(`SHOW COLUMNS FROM obs_humedales LIKE 'fuente'`);
    if (humedalCols.length === 0) {
      await queryRunner.query(`ALTER TABLE obs_humedales ADD COLUMN fuente VARCHAR(500) NULL`);
      await queryRunner.query(`ALTER TABLE obs_humedales ADD COLUMN fuenteImagen VARCHAR(255) NULL`);
      await queryRunner.query(`ALTER TABLE obs_humedales ADD COLUMN tipoVegetacion JSON NULL`);
      await queryRunner.query(`ALTER TABLE obs_humedales MODIFY COLUMN funcionPrincipal TEXT`);
    }

    // ── obs_notihumedal: add fuenteImagen ──
    const notiCols = await queryRunner.query(`SHOW COLUMNS FROM obs_notihumedal LIKE 'fuenteImagen'`);
    if (notiCols.length === 0) {
      await queryRunner.query(`ALTER TABLE obs_notihumedal ADD COLUMN fuenteImagen VARCHAR(255) NULL`);
    }

    // ── Update existing tipoHumedal values to new ha_ prefix format ──
    await queryRunner.query(`UPDATE obs_humedales SET tipoHumedal = 'ha_fws' WHERE tipoHumedal IN ('conservacion', 'recreativo', 'captacion_pluvial')`);
    await queryRunner.query(`UPDATE obs_humedales SET tipoHumedal = 'ha_sfs_horizontal' WHERE tipoHumedal IN ('tratamiento_aguas', 'restauracion_hidrologica')`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert tipoHumedal values
    await queryRunner.query(`UPDATE obs_humedales SET tipoHumedal = 'conservacion' WHERE tipoHumedal = 'ha_fws'`);
    await queryRunner.query(`UPDATE obs_humedales SET tipoHumedal = 'tratamiento_aguas' WHERE tipoHumedal = 'ha_sfs_horizontal'`);

    // Remove added columns
    await queryRunner.query(`ALTER TABLE obs_notihumedal DROP COLUMN fuenteImagen`);
    await queryRunner.query(`ALTER TABLE obs_humedales DROP COLUMN tipoVegetacion`);
    await queryRunner.query(`ALTER TABLE obs_humedales DROP COLUMN fuenteImagen`);
    await queryRunner.query(`ALTER TABLE obs_humedales DROP COLUMN fuente`);
    await queryRunner.query(`ALTER TABLE obs_humedales MODIFY COLUMN funcionPrincipal VARCHAR(255) NOT NULL`);
    await queryRunner.query(`ALTER TABLE observatory_admins DROP COLUMN permissions`);
    await queryRunner.query(`ALTER TABLE observatory_admins DROP COLUMN role`);
  }
}
