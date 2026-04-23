import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixAragonImagePaths1719000000000 implements MigrationInterface {
  name = 'FixAragonImagePaths1719000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE obs_humedales SET imagen = '/images/humedales/aragon-stha.jpg' WHERE imagen = '/images/humedales/aragon.jpg'`
    );
    await queryRunner.query(
      `UPDATE obs_humedales SET imagen = '/images/humedales/aragon-espiral.jpg' WHERE imagen = '/images/humedales/aragon-segundo.jpg'`
    );
    console.log('  Fixed Aragon image paths (aragon.jpg → aragon-stha.jpg, aragon-segundo.jpg → aragon-espiral.jpg)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE obs_humedales SET imagen = '/images/humedales/aragon.jpg' WHERE imagen = '/images/humedales/aragon-stha.jpg'`
    );
    await queryRunner.query(
      `UPDATE obs_humedales SET imagen = '/images/humedales/aragon-segundo.jpg' WHERE imagen = '/images/humedales/aragon-espiral.jpg'`
    );
  }
}
