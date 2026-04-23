import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCiiemadCuajimalpaHumedales1718000000000 implements MigrationInterface {
  name = 'AddCiiemadCuajimalpaHumedales1718000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Insert CIIEMAD-IPN experimental wetland if not exists ──
    const ciiemad = await queryRunner.query(
      `SELECT id FROM obs_humedales WHERE nombre LIKE '%CIIEMAD%' LIMIT 1`
    );
    if (ciiemad.length === 0) {
      await queryRunner.query(`
        INSERT INTO obs_humedales (
          nombre, alcaldia, ubicacion, tipoHumedal, tipoVegetacion,
          funcionPrincipal, anioImplementacion, vegetacion, sustrato,
          usoAgua, serviciosEcosistemicos, serviciosDescripcion,
          monitoreo, estado, lat, lng, fuente,
          visible, archivado
        ) VALUES (
          'Humedal Artificial Experimental CIIEMAD-IPN',
          'Gustavo A. Madero',
          'Centro Interdisciplinario de Investigaciones y Estudios sobre Medio Ambiente y Desarrollo (CIIEMAD), IPN. Calle 30 de Junio de 1520 s/n, Barrio La Laguna Ticoman',
          'ha_sfs_horizontal',
          '["emergente"]',
          'Tratamiento experimental de aguas grises residuales mediante flujo subsuperficial',
          '2024',
          '["Canna indica", "Iris spp."]',
          'Tezontle, carbon activado y olote',
          'Investigacion y tratamiento de aguas grises a nivel hogar',
          '["depuracion_agua", "educacion_ambiental"]',
          '["Remocion documentada: DBO5 92.07%, SST 81.31%, amonio 96.67%, fosforo 88.81%", "Investigacion de posgrado y formacion en tecnologias de tratamiento basadas en la naturaleza (CIIEMAD-IPN)"]',
          'Eficiencias de remocion: DBO5 92.07%, SST 81.31%, amonio 96.67%, fosforo 88.81%. Sistema experimental vinculado a tesis de maestria CIIEMAD-IPN (Dominguez Solis, 2025).',
          'activo',
          19.5138995, -99.1288954,
          'Dominguez Solis, D. (2025). Humedal artificial: una solucion basada en la naturaleza para el tratamiento de aguas residuales a nivel hogar en la Colonia La Laguna Ticoman, CDMX. Tesis de maestria, CIIEMAD-IPN.',
          true, false
        )
      `);
      console.log('  CIIEMAD-IPN humedal inserted');
    }

    // ── Insert San Mateo Tlaltenango / UAM Cuajimalpa wetland if not exists ──
    const cuajimalpa = await queryRunner.query(
      `SELECT id FROM obs_humedales WHERE nombre LIKE '%San Mateo Tlaltenango%' LIMIT 1`
    );
    if (cuajimalpa.length === 0) {
      await queryRunner.query(`
        INSERT INTO obs_humedales (
          nombre, alcaldia, ubicacion, tipoHumedal, tipoVegetacion,
          funcionPrincipal, capacidadTratamiento,
          anioImplementacion, vegetacion, sustrato,
          usoAgua, serviciosEcosistemicos, serviciosDescripcion,
          monitoreo, estado, lat, lng, imagen, fuente, fuenteImagen,
          visible, archivado
        ) VALUES (
          'Humedales Artificiales San Mateo Tlaltenango — UAM Cuajimalpa',
          'Cuajimalpa',
          'Colegio Bilbao y viviendas del pueblo originario de San Mateo Tlaltenango, Alcaldia Cuajimalpa',
          'ha_hibrido',
          '["emergente"]',
          'Tratamiento periurbano de aguas residuales domesticas mediante sistema hibrido (flujo horizontal + vertical) con biodigestor anaerobio, tanques de aireacion y desinfeccion',
          '~700 L/semana (~100 L/d) en Colegio Bilbao; 3 sistemas adicionales en viviendas',
          '2019',
          '["Cortaderia selloana (cola de zorro)", "Arundo donax (carrizo)", "Juncus spp. (junco triangular)"]',
          'Grava',
          'Recirculacion a sanitarios del colegio y riego',
          '["depuracion_agua", "educacion_ambiental", "captura_carbono"]',
          '["Tratamiento de aguas residuales de sanitarios, cumple NOM-003-SEMARNAT-1997", "Programa de talleres comunitarios de educacion ambiental y sensibilizacion", "Captura de CO2 por vegetacion acuatica en ecosistema periurbano"]',
          'Inaugurado el 4 de noviembre de 2019. Proyecto Transformacion socio-tecnologica para el manejo sustentable del agua. Financiado por Conacyt y Royal Academy of Engineering (UK). Investigadoras: Dras. Miriam Alfie Cohen y Flor Yunuen Garcia Becerra (UAM Cuajimalpa). Consultora: Quimica Monica L. Rodriguez Estrada (GMI).',
          'activo',
          19.3560000, -99.2890000,
          '/images/humedales/cuajimalpa-smt.jpg',
          'Semanario de la UAM, Ano 1, Num. 12, 11 de noviembre de 2019; UAM Cuajimalpa — Proyecto Humedales Regenerativos Periurbanos.',
          'UAM Cuajimalpa — Proyecto Humedales Regenerativos Periurbanos (2019)',
          true, false
        )
      `);
      console.log('  San Mateo Tlaltenango / UAM Cuajimalpa humedal inserted');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM obs_humedales WHERE nombre LIKE '%CIIEMAD%'`);
    await queryRunner.query(`DELETE FROM obs_humedales WHERE nombre LIKE '%San Mateo Tlaltenango%'`);
  }
}
