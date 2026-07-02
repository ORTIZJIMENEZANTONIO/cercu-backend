import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Siembra las secciones del home de humedales que quedaban hardcodeadas en el
 * frontend y ahora son editables desde /admin/contenido/home:
 *   headers · kpis · odsTeaser · mapTeaser · disclaimer
 *
 * Mismo patrón idempotente que 1740: upsert por (observatory, pageSlug,
 * sectionKey). Si la fila ya existe NO se sobrescribe (preserva ediciones
 * humanas). Marca updatedBy='migration:1743' para rollback selectivo.
 */
export class SeedHomeFullyEditableCmsSections1743000000000 implements MigrationInterface {
  name = 'SeedHomeFullyEditableCmsSections1743000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const upsertSection = async (
      observatory: string,
      pageSlug: string,
      sectionKey: string,
      items: any[],
    ) => {
      const existing = await queryRunner.query(
        `SELECT id FROM obs_cms_sections WHERE observatory = ? AND pageSlug = ? AND sectionKey = ? LIMIT 1`,
        [observatory, pageSlug, sectionKey],
      );
      if (existing.length === 0) {
        await queryRunner.query(
          `INSERT INTO obs_cms_sections (observatory, pageSlug, sectionKey, items, updatedBy) VALUES (?, ?, ?, ?, ?)`,
          [observatory, pageSlug, sectionKey, JSON.stringify(items), 'migration:1743'],
        );
      }
    };

    // home.headers — encabezados (tag/title/subtitle) de cada bloque, por id
    await upsertSection('humedales', 'home', 'headers', [
      { id: 'about', tag: 'Acerca de', title: '¿Qué es el observatorio?', subtitle: 'Una plataforma integral para el monitoreo, análisis y visualización de humedales artificiales en la Ciudad de México.' },
      { id: 'proceso', tag: 'Proceso', title: 'Cómo funciona', subtitle: 'Un flujo de trabajo que integra datos geoespaciales, caracterización técnica y análisis de servicios ecosistémicos.' },
      { id: 'tipologias', tag: 'Clasificación', title: 'Tipologías de humedales artificiales', subtitle: 'Tres categorías principales identificadas en el inventario de la Ciudad de México.' },
      { id: 'servicios', tag: 'Beneficios', title: 'Servicios ecosistémicos', subtitle: 'Principales beneficios ambientales que proveen los humedales artificiales de la CDMX.' },
      { id: 'ods', tag: 'ODS', title: 'Alineación con la Agenda 2030', subtitle: 'Los humedales artificiales contribuyen directamente a cuatro Objetivos de Desarrollo Sostenible.' },
    ]);

    // home.kpis — indicadores; los 3 derivados de datos se recalculan por label
    await upsertSection('humedales', 'home', 'kpis', [
      { label: 'Humedales artificiales inventariados', valor: '13', unidad: '', color: 'primary' },
      { label: 'Superficie total', valor: '71,406', unidad: 'm² documentados', color: 'eco' },
      { label: 'Alcaldías con humedales artificiales', valor: '7', unidad: '', color: 'secondary' },
      { label: 'Tipologías principales', valor: '3', unidad: '', color: 'accent' },
      { label: 'Capacidad de tratamiento', valor: '~2,640', unidad: 'm³/día', color: 'primary' },
      { label: 'Servicios ecosistémicos', valor: '9', unidad: 'tipos identificados', color: 'eco' },
    ]);

    // home.odsTeaser — mini-cards ODS
    await upsertSection('humedales', 'home', 'odsTeaser', [
      { numero: '6', nombre: 'Agua limpia', color: '#26BDE2' },
      { numero: '11', nombre: 'Ciudades sostenibles', color: '#FD9D24' },
      { numero: '13', nombre: 'Acción por el clima', color: '#3F7E44' },
      { numero: '15', nombre: 'Vida de ecosistemas', color: '#56C02B' },
    ]);

    // home.mapTeaser — teaser del mapa
    await upsertSection('humedales', 'home', 'mapTeaser', [
      { tag: 'Mapa', title: 'Explora la ubicación de los humedales artificiales', subtitle: 'Visualiza los humedales artificiales inventariados en un mapa interactivo con datos técnicos detallados.', cta: 'Ver mapa completo', ctaLink: '/mapa' },
    ]);

    // home.disclaimer — aviso de fuente de datos
    await upsertSection('humedales', 'home', 'disclaimer', [
      { label: 'Fuente de datos:', body: 'Inventario de humedales artificiales en la Ciudad de México, Fase 1. Elaboración: M. en C. Diego Domínguez Solís — Instituto Politécnico Nacional.' },
    ]);

    console.log('  Humedales home fully-editable: 5 sections upserted (headers, kpis, odsTeaser, mapTeaser, disclaimer)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Solo borra lo que esta migración creó y nadie tocó (updatedBy intacto).
    await queryRunner.query(
      `DELETE FROM obs_cms_sections WHERE updatedBy = 'migration:1743'`,
    );
  }
}
