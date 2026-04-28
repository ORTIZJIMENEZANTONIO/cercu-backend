import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUAMAzcapotzalcoHumedal1720000000000 implements MigrationInterface {
  name = 'AddUAMAzcapotzalcoHumedal1720000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Insert UAM-Azcapotzalco pilot wetland (Barceló et al., IMTA 2014) ──
    const existing = await queryRunner.query(
      `SELECT id FROM obs_humedales WHERE nombre LIKE '%UAM-Azcapotzalco%' LIMIT 1`
    );
    if (existing.length === 0) {
      await queryRunner.query(`
        INSERT INTO obs_humedales (
          nombre, alcaldia, ubicacion, tipoHumedal, tipoVegetacion,
          funcionPrincipal, superficie, capacidadTratamiento,
          anioImplementacion, vegetacion, sustrato,
          usoAgua, serviciosEcosistemicos, serviciosDescripcion,
          monitoreo, estado, lat, lng, imagen, fuente, fuenteImagen,
          visible, archivado
        ) VALUES (
          'Humedal Artificial Piloto UAM-Azcapotzalco (sistema hibrido humedal-laguna-pulimento)',
          'Azcapotzalco',
          'Universidad Autonoma Metropolitana, Unidad Azcapotzalco. Av. San Pablo 180, Col. Reynosa Tamaulipas, Alcaldia Azcapotzalco',
          'ha_hibrido',
          '["emergente"]',
          'Tratamiento piloto de aguas residuales municipales mediante sistema hibrido en serie: humedal subsuperficial horizontal (HAFSS) -> laguna de maduracion -> humedal subsuperficial horizontal de pulimento',
          143,
          '0.091 L/s (~7.86 m3/d)',
          '2010',
          '["Typha latifolia (tule)", "Phragmites australis (carrizo)"]',
          'Grava volcanica (lecho 0.82-0.88 m de espesor); 3 canales paralelos en humedal primario (12.15 m x 2.6 m c/u) y 3 canales en humedal de pulimento (6.15 m x 2.6 m c/u); laguna de maduracion con profundidad 0.98 m',
          'Investigacion y demostracion a nivel piloto. Recibe aguas de banos del edificio de biblioteca y descargas de la planta El Rosario',
          '["depuracion_agua", "educacion_ambiental"]',
          '["Remocion de ~65% de materia organica documentada (otono 2012)", "Nitrificacion casi completa (reduccion de NH4+ con incremento de NO3-)", "Plataforma de investigacion y formacion de posgrado en ingenieria ambiental (UAM-A)"]',
          'Mediciones de campo otono 2012: 65% de remocion promedio de materia organica y nitrificacion casi completa. Perdida del 60% del volumen en 21 dias por evapotranspiracion. Se documentaron zonas muertas hidraulicas en la laguna. Trabajos derivados sobre remocion de fosforo en humedal subsuperficial horizontal (Barcelo-Quintal et al., 2019, repositorio Zaloamati UAM). Fuente principal: Barcelo et al. (2014), capitulo en libro IMTA.',
          'piloto',
          19.5040, -99.1864,
          '/images/humedales/uam-azcapotzalco.jpg',
          'Barcelo, I.D., Solis, H.E., Garcia, J., Salazar, M., Rivas, A., Giacoman, G. y Zetina, C. (2014). Comportamiento de un sistema humedal-laguna de maduracion-humedal de pulimento a nivel piloto para el tratamiento de aguas municipales en la Universidad Autonoma Metropolitana de la Unidad Azcapotzalco. En A. Rivas Hernandez y D. Paredes Cuervo (Eds.), Sistemas de humedales para el manejo, tratamiento y mejoramiento de la calidad del agua (pp. 62-67). Jiutepec, Morelos: IMTA / Universidad Tecnologica de Pereira. ISBN 978-958-722-319-09.',
          'Barcelo et al. (2014) - IMTA, Sistemas de humedales para el manejo, tratamiento y mejoramiento de la calidad del agua (p. 62-67). Imagen del libro en biblioteca digital del IMTA',
          true, false
        )
      `);
      console.log('  UAM-Azcapotzalco pilot humedal inserted');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM obs_humedales WHERE nombre LIKE '%UAM-Azcapotzalco%'`);
  }
}
