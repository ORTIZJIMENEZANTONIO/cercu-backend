import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShattoEncitHumedales1717000000000 implements MigrationInterface {
  name = 'AddShattoEncitHumedales1717000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Insert SHATTO (Facultad de Quimica, UNAM) if not exists ──
    const shatto = await queryRunner.query(
      `SELECT id FROM obs_humedales WHERE nombre LIKE '%SHATTO%' LIMIT 1`
    );
    if (shatto.length === 0) {
      await queryRunner.query(`
        INSERT INTO obs_humedales (
          nombre, alcaldia, ubicacion, tipoHumedal, tipoVegetacion,
          funcionPrincipal, anioImplementacion, vegetacion, sustrato,
          usoAgua, serviciosEcosistemicos, serviciosDescripcion,
          monitoreo, estado, lat, lng, imagen, fuente, fuenteImagen,
          visible, archivado
        ) VALUES (
          'SHATTO — Humedal Artificial Facultad de Quimica UNAM',
          'Coyoacan',
          'Facultad de Quimica, Ciudad Universitaria, UNAM. Contiguo a Auditorios A y B',
          'ha_sfs_horizontal',
          '["emergente"]',
          'Tratamiento de aguas residuales de sanitarios mediante sistema de flujo subsuperficial (3 contenedores en serie: 2 flujo horizontal + 1 vertical) con sistema electroquimico acoplado',
          '2024',
          '["Carrizo (Arundo donax)", "Iris spp."]',
          'Grava',
          'Riego de areas verdes y mantenimiento de sanitarios',
          '["depuracion_agua", "educacion_ambiental", "captura_carbono"]',
          '["Tratamiento de agua de sanitarios con sistema electroquimico + humedales subsuperficiales en serie", "Investigacion, docencia, divulgacion e interaccion con estudiantes y academicos", "Fijacion de CO2 y generacion de oxigeno por vegetacion depuradora y polinizadora"]',
          'Sistema inaugurado en junio 2024. Resultado de 34 anos de trabajo continuo del GAIA (Luna-Pabello, V.M.). Incluye celdas fotovoltaicas y captacion pluvial planificadas. 2 patentes.',
          'activo',
          19.3257000, -99.1800000,
          '/images/humedales/shatto-fq.jpg',
          'Facultad de Quimica, UNAM (2024); DGCS-UNAM, Boletin 489/2024; Gaceta UNAM (2024). Proyecto GAIA — Luna-Pabello, V.M.',
          'Facultad de Quimica, UNAM — Comunicacion (2024)',
          true, false
        )
      `);
      console.log('  SHATTO humedal inserted');
    }

    // ── Insert ENCiT (Escuela Nacional de Ciencias de la Tierra, UNAM) if not exists ──
    const encit = await queryRunner.query(
      `SELECT id FROM obs_humedales WHERE nombre LIKE '%ENCiT%' LIMIT 1`
    );
    if (encit.length === 0) {
      await queryRunner.query(`
        INSERT INTO obs_humedales (
          nombre, alcaldia, ubicacion, tipoHumedal, tipoVegetacion,
          funcionPrincipal, superficie, capacidadTratamiento,
          anioImplementacion, vegetacion, sustrato,
          usoAgua, serviciosEcosistemicos, serviciosDescripcion,
          monitoreo, estado, lat, lng, imagen, fuente, fuenteImagen,
          visible, archivado
        ) VALUES (
          'Humedal Artificial ENCiT — Escuela Nacional de Ciencias de la Tierra, UNAM',
          'Coyoacan',
          'Escuela Nacional de Ciencias de la Tierra (ENCiT), Ciudad Universitaria, UNAM',
          'ha_hibrido',
          '["emergente"]',
          'Tratamiento de aguas residuales de 12 sanitarios (3 niveles) mediante sistema hibrido (subsuperficial + superficial) con ecotecnologias integradas',
          20.00,
          '400 L/d (entrada); 270-300 L/d recuperados',
          '2022',
          '["Sombrerillo (Hydrocotyle spp.)", "Juncos (Juncus spp.)", "Espadanas (Typha spp.)", "Carrizos (Arundo donax)"]',
          'Grava',
          'Riego de areas verdes y reuso en mantenimiento',
          '["depuracion_agua", "educacion_ambiental", "habitat_fauna", "captura_carbono"]',
          '["Biorremediacion de aguas grises de sanitarios, cumple NOM-003-ECOL-1997", "Espacio de formacion e investigacion en ecotecnologia", "Conservacion de biodiversidad acuatica en ecosistema consolidado", "Fijacion de CO2 por vegetacion acuatica emergente"]',
          'Operativo desde 2022, consolidado como ecosistema funcional en 2025. Cumple NOM-003-ECOL-1997. Modelo replicado en Fac. Quimica (SHATTO), Fac. Ciencias Politicas y Sociales, y planeado en CCH Sur. Coordinadora: Profa. Isabel Mejia Luna.',
          'activo',
          19.3295000, -99.1770000,
          '/images/humedales/encit.jpg',
          'Gaceta UNAM (2025). En la ENCiT consolidan humedal con ecotecnologia.',
          'Gaceta UNAM (2025)',
          true, false
        )
      `);
      console.log('  ENCiT humedal inserted');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM obs_humedales WHERE nombre LIKE '%SHATTO%'`);
    await queryRunner.query(`DELETE FROM obs_humedales WHERE nombre LIKE '%ENCiT%'`);
  }
}
