import crypto from 'crypto';
import { AppDataSource } from '../ormconfig';
import { ObsReefNews } from '../entities/observatory/ReefNews';
import { ObsReefNewsProspect } from '../entities/observatory/ReefNewsProspect';

// Idempotente — sólo siembra si la tabla está vacía. Crea 3 artículos
// curados (con crédito a sus fuentes originales cuando aplica) y 1
// prospecto de demostración para que el panel admin tenga algo en la cola
// hasta que se ejecute el scraper real.
export async function seedArrecifesNews() {
  const newsRepo = AppDataSource.getRepository(ObsReefNews);
  const prospectRepo = AppDataSource.getRepository(ObsReefNewsProspect);

  if ((await newsRepo.count()) === 0) {
    await newsRepo.save(newsRepo.create([
      {
        title: 'Cabo Pulmo, el arrecife que se recuperó porque la comunidad lo decidió',
        slug: 'cabo-pulmo-recuperacion-comunitaria',
        summary:
          'En 1995 los pescadores de Cabo Pulmo solicitaron a la federación declarar el arrecife como Parque Nacional. Veinte años después la biomasa se multiplicó por cuatro — un caso emblemático de manejo comunitario.',
        content:
          '<p>Cabo Pulmo es uno de los arrecifes más antiguos del Pacífico oriental: aproximadamente 20 mil años. Hasta finales del siglo XX la sobrepesca había llevado a sus poblaciones de huachinango, pargo y tiburón al borde del colapso.</p><p>En 1995 las familias pescadoras de la zona solicitaron a la SEMARNAP declarar el sitio Parque Nacional, lo que ocurrió en 2005 con un núcleo de no extracción del 35% del polígono. La biomasa total del arrecife se cuadruplicó entre 1999 y 2009 (Aburto-Oropeza et al., PLoS ONE 2011), el aumento más alto registrado en cualquier ANP marina del mundo. La pesquería local pivotó al turismo de buceo.</p><p>El caso de Cabo Pulmo es referencia internacional para diseñar áreas marinas protegidas con co-manejo comunitario.</p>',
        author: 'Equipo del Observatorio',
        publishedAt: '2026-04-22',
        tags: ['Cabo Pulmo', 'co-manejo', 'ANP marina', 'recuperación'],
        image: '/images/reefs/cabo-pulmo.jpg',
        imageCredit: 'Octavio Aburto / iLCP',
        source: 'Síntesis del Observatorio',
        sourceUrl: 'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0023601',
        visible: true,
        archived: false,
      },
      {
        title: 'Sargazo en el Caribe mexicano: ¿qué pasó en 2025?',
        slug: 'sargazo-caribe-2025',
        summary:
          'El Cinturón Atlántico de Sargazo arrojó al Caribe mexicano una temporada de arribazones por encima del promedio. El monitoreo NOAA y la red local documentan los impactos en arrecifes someros.',
        content:
          '<p>Desde 2011 con un pico inicial en 2018, las arribazones masivas de <em>Sargassum natans</em> y <em>S. fluitans</em> se volvieron parte del paisaje del Caribe mexicano. La temporada 2025 superó las predicciones.</p><p>La descomposición en línea de costa consume oxígeno disuelto y libera sulfhídrico, afectando arrecifes someros y pastos marinos. Sitios como Puerto Morelos y Xcalak documentaron episodios de mortalidad coral asociados.</p><p>El Sargassum Watch System (NOAA + Universidad del Sur de Florida) entrega imágenes satelitales semanales que permiten anticipar arribazones a 5–7 días.</p>',
        author: 'Equipo del Observatorio',
        publishedAt: '2026-03-15',
        tags: ['sargazo', 'Caribe', 'NOAA SaWS', 'monitoreo'],
        image: '/images/reefs/sargazo.jpg',
        imageCredit: 'NOAA / Sargassum Watch System',
        source: 'NOAA Sargassum Watch',
        sourceUrl: 'https://optics.marine.usf.edu/projects/saws.html',
        visible: true,
        archived: false,
      },
      {
        title: 'SCTLD: la enfermedad que avanza por el Sistema Arrecifal Mesoamericano',
        slug: 'sctld-mesoamericano-2026',
        summary:
          'La Stony Coral Tissue Loss Disease (SCTLD) llegó al Caribe mexicano en 2018 y para 2026 ha sido detectada en al menos siete sitios del SAM. Afecta a más de 20 especies de coral pétreo.',
        content:
          '<p>SCTLD es una enfermedad de etiología desconocida, posiblemente bacteriana, que produce lesiones en el tejido coralino con mortalidad rápida. Identificada por primera vez en Florida (2014), llegó a Quintana Roo en 2018.</p><p>Las acciones de respuesta incluyen monitoreo intensivo (CONANP, ICML-UNAM, AGRRA), aplicación de antibióticos en colonias prioritarias (amoxicilina en pasta) y rescate de fragmentos para arrecifes "arca" en cautiverio.</p><p>La Healthy Reefs Initiative coordina el reporte regional. Para mantenerse al día consulta su <a href="https://www.healthyreefs.org" target="_blank" rel="noopener">portal</a>.</p>',
        author: 'Equipo del Observatorio',
        publishedAt: '2026-02-08',
        tags: ['SCTLD', 'enfermedad coral', 'SAM', 'Caribe'],
        image: '/images/reefs/sctld.jpg',
        imageCredit: 'AGRRA',
        source: 'Healthy Reefs Initiative',
        sourceUrl: 'https://www.healthyreefs.org',
        visible: true,
        archived: false,
      },
    ]));
    console.log('  ObsReefNews: 3 artículos creados');
  }

  if ((await prospectRepo.count()) === 0) {
    const url = 'https://es.mongabay.com/2026/04/mexico-comunidades-fallo-descontaminar-rios/';
    await prospectRepo.save(
      prospectRepo.create({
        title: 'México: comunidades lograron un fallo que ordena descontaminar los ríos',
        summary:
          'Tres comunidades del litoral del Caribe lograron un fallo histórico que obliga al estado a ejecutar un plan de descontaminación de cuencas que desembocan en zonas arrecifales.',
        url,
        source: 'Mongabay Latam',
        publishedAt: '2026-04-21',
        image: 'https://imgs.mongabay.com/wp-content/uploads/sites/25/2026/04/rios-fallo.jpeg',
        status: 'pending',
        urlHash: crypto.createHash('sha256').update(url).digest('hex'),
        reviewedBy: null,
      }),
    );
    console.log('  ObsReefNewsProspect: 1 prospecto demo creado');
  }
}
