import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddForoMagdalenaContrerasHumedal1721000000000 implements MigrationInterface {
  name = 'AddForoMagdalenaContrerasHumedal1721000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Insert Foro Cultural Magdalena Contreras pilot wetland (SECTEI-UNAM-GMI 2022) ──
    // Registro provisional con visible=false (pendiente de verificacion con IIngen UNAM)
    const existing = await queryRunner.query(
      `SELECT id FROM obs_humedales WHERE nombre LIKE '%Foro Cultural%Magdalena Contreras%' LIMIT 1`
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
          'Humedal Artificial Demostrativo Foro Cultural - Magdalena Contreras (PENDIENTE DE VERIFICACION)',
          'Magdalena Contreras',
          'Foro Cultural de La Magdalena Contreras (antigua fabrica textil "El Aguila"), Camino Real de Contreras 27, Col. La Concepcion, Alcaldia La Magdalena Contreras (sitio inferido - pendiente de confirmar con Instituto de Ingenieria UNAM)',
          'ha_sfs_horizontal',
          '["emergente"]',
          'Tratamiento descentralizado de aguas residuales y reuso del efluente para riego, dentro del proyecto SECTEI-UNAM "Recuperacion hidrica de los pedregales del Xitle y cuenca del Rio Magdalena en sitios de interes geo-patrimonial"',
          '2022',
          '["Vegetacion emergente nativa (Phragmites/Typha - inferida por analogia con humedales hermanos del programa, no documentada)"]',
          'Grava (inferido por analogia con CCH Oriente y ENCiT, mismo equipo SECTEI-UNAM-GMI; no documentado publicamente)',
          'Reuso del efluente tratado para riego de areas verdes del recinto cultural (modelo descarga cero)',
          '["depuracion_agua", "educacion_ambiental"]',
          '["Tratamiento descentralizado de aguas residuales (modelo hermano de CCH Oriente y ENCiT, mismo equipo)", "Demostracion publica y divulgacion cientifica en recinto cultural de la alcaldia (proyecto SECTEI-UNAM)"]',
          'REGISTRO PENDIENTE DE VERIFICACION. Identificacion basada en triangulacion de fuentes oficiales (SECTEI 2022, Gaceta UNAM 2023, DGCS-UNAM Boletin 1060/2022) y video narrado por Q. Monica L. Rodriguez Estrada (IIngen UNAM / GMI Grupo Multidisciplinario Integral S.C.) en pagina oficial de la alcaldia Magdalena Contreras (Facebook). Tipo de flujo, superficie, capacidad y especies vegetales NO figuran en comunicados oficiales publicos. Para verificacion contactar Dra. Alma Concepcion Chavez Mejia (IIngen UNAM, lider tecnico). Coordinacion cientifica complementaria: Dra. Lucia Almeida Lenero (Fac. Ciencias UNAM), Dra. Ana Lillian Martin del Pozzo (Inst. Geofisica UNAM).',
          'piloto',
          19.3328, -99.2280,
          '/images/humedales/foro-magdalena.jpg',
          'SECTEI CDMX (2022) - Proyectos para el rescate del Rio Magdalena; Gaceta UNAM (enero 2023) - Instala la UNAM humedales para tratamiento y reutilizacion del agua; DGCS-UNAM Boletin 1060/2022. Coordinacion UNAM: Dra. Alma C. Chavez Mejia (IIngen), Dra. Lucia Almeida Lenero (Fac. Ciencias), Dra. Ana L. Martin del Pozzo (Inst. Geofisica). Construccion: GMI - Grupo Multidisciplinario Integral, S.C. Narracion tecnica del video referencial: Q. Monica L. Rodriguez Estrada (IIngen UNAM / GMI).',
          'Foto referencial: humedales hermanos del programa SECTEI-UNAM-GMI (CCH Oriente / ENCiT). DGCS-UNAM, Boletin 1060/2022. Imagen especifica del humedal de Magdalena Contreras pendiente de confirmacion con Instituto de Ingenieria UNAM',
          false, false
        )
      `);
      console.log('  Foro Cultural Magdalena Contreras pilot humedal inserted (visible=false)');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM obs_humedales WHERE nombre LIKE '%Foro Cultural%Magdalena Contreras%'`);
  }
}
