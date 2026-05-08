import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Inserts the CCH Oriente artificial wetland into obs_humedales.
 *
 * Project: SECTEI CDMX + Grupo Multidisciplinario Integral, S.C. (GMI), in
 * collaboration with UNAM. Installed at the end of 2019 at the Colegio de
 * Ciencias y Humanidades, Plantel Oriente. The wetland receives water from
 * a bathroom module on campus and reuses the effluent for irrigation of
 * gardens and an ornamental-plant demonstration area.
 *
 * Confirmed sources:
 *  - Gaceta UNAM (Jan 2023) "Instala la UNAM humedales para tratamiento y
 *    reutilizacion del agua".
 *  - DGCS-UNAM, Boletin 1060/2022 "Con humedales, la UNAM cuenta con
 *    instalaciones sustentables".
 *  - UNAM Global "Humedal artificial en la UNAM: innovacion en tratamiento
 *    de aguas residuales".
 *  - Fundacion UNAM "Humedales en la UNAM".
 *  - PortalAmbiental.com.mx (22 dic 2022).
 *
 * Vegetation reported in UNAM communications: papiro (Cyperus papyrus),
 * carrizo (Phragmites/Arundo) y cola de caballo (Equisetum). Substrate:
 * gravas de diferentes tamanios con biopelicula. Specific surface area
 * and treatment capacity for this site are NOT publicly reported (the
 * sibling ENCiT system handles 600 L/d as reference for the program).
 *
 * Idempotent: inserts only if no row with nombre matching CCH Oriente exists.
 */
export class AddCCHOrienteHumedal1737000000000 implements MigrationInterface {
  name = 'AddCCHOrienteHumedal1737000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.query(
      `SELECT id FROM obs_humedales WHERE nombre LIKE '%CCH Oriente%' LIMIT 1`
    );
    if (existing.length === 0) {
      await queryRunner.query(`
        INSERT INTO obs_humedales (
          nombre, alcaldia, ubicacion, tipoHumedal, tipoVegetacion,
          funcionPrincipal, anioImplementacion, vegetacion, sustrato,
          usoAgua, serviciosEcosistemicos, serviciosDescripcion,
          monitoreo, estado, lat, lng, imagen, fuente, fuenteImagen,
          visible, archivado
        ) VALUES (
          'Humedal Artificial CCH Oriente - UNAM',
          'Iztapalapa',
          'Colegio de Ciencias y Humanidades, Plantel Oriente, UNAM. Av. Canal de San Juan esq. Sur 24, Col. Tepalcates, Iztapalapa, C.P. 09210',
          'ha_sfs_horizontal',
          '["emergente"]',
          'Tratamiento descentralizado de aguas residuales provenientes de un modulo de banios del plantel, con reuso del efluente para riego de jardines y de un espacio demostrativo de arboles y plantas ornamentales (modelo educativo y de descarga cero)',
          '2019',
          '["Papiro (Cyperus papyrus)", "Carrizo (Phragmites australis / Arundo donax)", "Cola de caballo (Equisetum spp.)"]',
          'Gravas de diferentes tamanios con biopelicula adherida (humedal de tipo subsuperficial inferido por descripcion del proceso fisicoquimico-microbiologico)',
          'Riego de areas verdes del plantel y espacio demostrativo de arboles y plantas ornamentales',
          '["depuracion_agua", "educacion_ambiental", "habitat_fauna", "captura_carbono"]',
          '["Tratamiento de aguas residuales del modulo de banios mediante procesos fisicoquimicos y microbiologicos (gravas + biopelicula + plantas)", "Demostracion educativa abierta a estudiantes y academicos: ventajas frente a plantas convencionales, estudio de presencia de metales pesados y remocion de compuestos organicos", "Habitat para microorganismos y plantas acuaticas en entorno escolar urbano", "Fijacion de CO2 por vegetacion acuatica emergente"]',
          'Sistema operativo y vigente desde finales de 2019, confirmado como uno de los dos humedales del programa SECTEI-UNAM-GMI que se mantienen activos (junto con el de la ENCiT). Operacion automatizada que funciona principalmente fines de semana, noches y periodos vacacionales. No se han publicado eficiencias cuantitativas de remocion especificas para este sitio. El programa contempla costos por instalacion entre 300,000 y 600,000 pesos segun materiales, diseno y tamano. Referencia para el programa: ENCiT trata 600 L/d.',
          'activo',
          19.3919, -99.0581,
          '/images/humedales/cch-oriente.jpg',
          'SECTEI CDMX + Grupo Multidisciplinario Integral, S.C. (GMI), proyecto conjunto con UNAM (fines de 2019). Fuentes: Gaceta UNAM (enero 2023) - Instala la UNAM humedales para tratamiento y reutilizacion del agua (https://www.gaceta.unam.mx/instala-la-unam-humedales-para-tratamiento-y-reutilizacion-del-agua/); DGCS-UNAM, Boletin 1060/2022 - Con humedales, la UNAM cuenta con instalaciones sustentables (https://www.dgcs.unam.mx/boletin/bdboletin/2022_1060.html); UNAM Global - Humedal artificial en la UNAM: innovacion en tratamiento de aguas residuales (https://unamglobal.unam.mx/global_revista/humedal-artificial-en-la-unam-innovacion-en-tratamiento-de-aguas-residuales/); Fundacion UNAM - Humedales en la UNAM (https://www.fundacionunam.org.mx/donde-paso/humedales-en-la-unam/); PortalAmbiental.com.mx (22 dic 2022) - Con humedales, la UNAM cuenta con instalaciones sustentables.',
          'DGCS-UNAM, Boletin 1060/2022 / Gaceta UNAM (2023). Imagen institucional del programa SECTEI-UNAM-GMI',
          true, false
        )
      `);
      console.log('  CCH Oriente humedal inserted (visible=true)');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM obs_humedales WHERE nombre LIKE '%CCH Oriente%'`);
  }
}
