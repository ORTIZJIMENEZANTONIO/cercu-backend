import { AppDataSource } from '../ormconfig';
import { ObsReef } from '../entities/observatory/Reef';
import { ObsContributor } from '../entities/observatory/Contributor';
import { ObsConflict } from '../entities/observatory/Conflict';
import { ObsTier } from '../entities/observatory/Tier';
import { ObsLayer } from '../entities/observatory/Layer';

const G = (ids: string[]): string[] =>
  ids.map((id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`);

const REEFS = [
  { id: 1, name: 'Arrecife de Puerto Morelos', state: 'Quintana Roo', ocean: 'caribbean', region: 'Sistema Arrecifal Mesoamericano (SAM)', benthicClasses: ['coral_algae', 'sand', 'seagrass'], geomorphicClasses: ['fringing', 'reef_crest', 'lagoon'], area: 9067, depthRange: [1, 25], protection: 'anp_federal', status: 'warning', liveCoralCover: 18, bleachingAlert: 'warning', speciesRichness: 36, threats: ['thermal_stress', 'sargassum', 'tourism_pressure', 'disease_outbreak'], observations: 142, lat: 20.84, lng: -86.87, description: 'Parque Nacional Arrecife de Puerto Morelos. Barrera arrecifal tipo franjeante con laguna arrecifal somera. Forma parte del SAM y enfrenta presiones combinadas de turismo, sargazo y la enfermedad de pérdida de tejido coralino (SCTLD).', hero: '/images/reefs/puerto-morelos.jpg', imageCredit: 'Foto: Unsplash (ilustrativa) · Datos: CONANP' },
  { id: 2, name: 'Arrecife Cozumel', state: 'Quintana Roo', ocean: 'caribbean', region: 'Sistema Arrecifal Mesoamericano (SAM)', benthicClasses: ['coral_algae', 'rock', 'sand'], geomorphicClasses: ['fringing', 'reef_slope'], area: 11988, depthRange: [3, 50], protection: 'anp_federal', status: 'alert', liveCoralCover: 15, bleachingAlert: 'alert_1', speciesRichness: 42, threats: ['thermal_stress', 'cruise_anchoring', 'tourism_pressure', 'disease_outbreak'], observations: 287, lat: 20.39, lng: -86.97, description: 'Parque Nacional Arrecifes de Cozumel. Pendiente arrecifal con corrientes intensas y alta diversidad. El anclaje de cruceros y el SCTLD han reducido la cobertura coralina viva por debajo del 20%.', hero: '/images/reefs/cozumel.jpg', imageCredit: 'Foto: Unsplash (ilustrativa) · Datos: CONANP / Allen Coral Atlas' },
  { id: 3, name: 'Banco Chinchorro', state: 'Quintana Roo', ocean: 'caribbean', region: 'Sistema Arrecifal Mesoamericano (SAM)', benthicClasses: ['coral_algae', 'seagrass', 'sand'], geomorphicClasses: ['lagoon', 'reef_crest', 'patch_reef'], area: 144360, depthRange: [0, 40], protection: 'anp_federal', status: 'watch', liveCoralCover: 24, bleachingAlert: 'watch', speciesRichness: 95, threats: ['thermal_stress', 'sargassum', 'overfishing'], observations: 73, lat: 18.62, lng: -87.32, description: 'Reserva de la Biosfera Banco Chinchorro. Atolón coralino con la mayor extensión arrecifal del Atlántico mexicano. Reserva de la Biosfera y sitio Ramsar; alberga ~95 especies de coral.', hero: '/images/reefs/chinchorro.jpg', imageCredit: 'Foto: Unsplash (ilustrativa) · Datos: CONANP' },
  { id: 4, name: 'Sistema Arrecifal Veracruzano', state: 'Veracruz', ocean: 'gulf_of_mexico', region: 'Golfo de México', benthicClasses: ['coral_algae', 'sand', 'rubble'], geomorphicClasses: ['patch_reef', 'reef_flat'], area: 65516, depthRange: [0, 48], protection: 'anp_federal', status: 'alert', liveCoralCover: 12, bleachingAlert: 'alert_1', speciesRichness: 28, threats: ['sedimentation', 'nutrient_pollution', 'coastal_development', 'oil_spill'], observations: 98, lat: 19.18, lng: -96.10, description: 'Parque Nacional Sistema Arrecifal Veracruzano (PNSAV). Conjunto de 28 arrecifes platafórmicos frente al puerto de Veracruz. Presiona el desarrollo portuario, descargas y sedimentos del río Jamapa-Cotaxtla.', hero: '/images/reefs/sav.jpg', imageCredit: 'Foto: Unsplash (ilustrativa) · Datos: CONABIO' },
  { id: 5, name: 'Arrecifes de Xcalak', state: 'Quintana Roo', ocean: 'caribbean', region: 'Sistema Arrecifal Mesoamericano (SAM)', benthicClasses: ['coral_algae', 'seagrass', 'sand'], geomorphicClasses: ['fringing', 'lagoon', 'back_reef'], area: 17949, depthRange: [0, 35], protection: 'anp_federal', status: 'healthy', liveCoralCover: 31, bleachingAlert: 'no_stress', speciesRichness: 52, threats: ['thermal_stress', 'sargassum'], observations: 41, lat: 18.27, lng: -87.83, description: 'Parque Nacional Arrecifes de Xcalak. Sección sur del SAM, frontera con Belice. Arrecife franjeante con baja presión turística y cobertura coralina relativamente alta.', hero: '/images/reefs/xcalak.jpg', imageCredit: 'Foto: Unsplash (ilustrativa) · Datos: CONANP' },
  { id: 6, name: 'Cabo Pulmo', state: 'Baja California Sur', ocean: 'pacific', region: 'Golfo de California', benthicClasses: ['coral_algae', 'rock'], geomorphicClasses: ['fringing', 'reef_slope'], area: 7111, depthRange: [3, 25], protection: 'anp_federal', status: 'healthy', liveCoralCover: 39, bleachingAlert: 'no_stress', speciesRichness: 11, threats: ['thermal_stress', 'tourism_pressure'], observations: 156, lat: 23.45, lng: -109.43, description: 'Parque Nacional Cabo Pulmo. Único arrecife coralino vivo del Pacífico oriental. Tras la veda total establecida en 1995, la biomasa se recuperó >460%. Patrimonio Mundial UNESCO.', hero: '/images/reefs/cabo-pulmo.jpg', imageCredit: 'Foto: Unsplash (ilustrativa) · Datos: UNESCO / CONANP' },
  { id: 7, name: 'Isla Isabel', state: 'Nayarit', ocean: 'pacific', region: 'Pacífico mexicano central', benthicClasses: ['coral_algae', 'rock'], geomorphicClasses: ['fringing', 'patch_reef'], area: 194, depthRange: [3, 30], protection: 'anp_federal', status: 'watch', liveCoralCover: 22, bleachingAlert: 'watch', speciesRichness: 9, threats: ['thermal_stress', 'overfishing'], observations: 22, lat: 21.85, lng: -105.88, description: 'Parque Nacional Isla Isabel. Isla volcánica con comunidades coralinas de Pocillopora. Sitio Ramsar y refugio de aves marinas; presiones por flota pesquera regional.', hero: '/images/reefs/isla-isabel.jpg', imageCredit: 'Foto: Unsplash (ilustrativa) · Datos: CONANP' },
  { id: 8, name: 'Archipiélago de Revillagigedo', state: 'Colima', ocean: 'pacific', region: 'Pacífico oriental tropical', benthicClasses: ['coral_algae', 'rock'], geomorphicClasses: ['fringing', 'reef_slope'], area: 14808780, depthRange: [0, 60], protection: 'unesco', status: 'healthy', liveCoralCover: 35, bleachingAlert: 'no_stress', speciesRichness: 18, threats: ['thermal_stress'], observations: 67, lat: 18.81, lng: -111.07, description: 'Parque Nacional Revillagigedo. La mayor reserva marina totalmente protegida de Norteamérica (148,087 km²). Patrimonio Mundial UNESCO desde 2016. Comunidades coralinas en Socorro y Clarión.', hero: '/images/reefs/revillagigedo.jpg', imageCredit: 'Foto: Unsplash (ilustrativa) · Datos: UNESCO / CONANP' },
  { id: 9, name: 'Arrecife Alacranes', state: 'Yucatán', ocean: 'gulf_of_mexico', region: 'Plataforma de Yucatán', benthicClasses: ['coral_algae', 'seagrass', 'sand'], geomorphicClasses: ['lagoon', 'reef_crest', 'patch_reef'], area: 33396, depthRange: [0, 30], protection: 'anp_federal', status: 'watch', liveCoralCover: 26, bleachingAlert: 'watch', speciesRichness: 25, threats: ['thermal_stress', 'overfishing', 'plastic_pollution'], observations: 38, lat: 22.45, lng: -89.68, description: 'Parque Nacional Arrecife Alacranes. Único atolón coralino del Golfo de México. ~140 km al norte de Progreso. Refugio crítico para tortugas y aves marinas.', hero: '/images/reefs/alacranes.jpg', imageCredit: 'Foto: Unsplash (ilustrativa) · Datos: CONANP' },
  { id: 10, name: 'Huatulco', state: 'Oaxaca', ocean: 'pacific', region: 'Pacífico sur mexicano', benthicClasses: ['coral_algae', 'rock', 'sand'], geomorphicClasses: ['fringing', 'patch_reef'], area: 11891, depthRange: [1, 25], protection: 'anp_federal', status: 'warning', liveCoralCover: 19, bleachingAlert: 'warning', speciesRichness: 14, threats: ['thermal_stress', 'tourism_pressure', 'sedimentation'], observations: 54, lat: 15.72, lng: -96.13, description: 'Parque Nacional Huatulco. Comunidades coralinas en bahías protegidas (La Entrega, Cacaluta, San Agustín). Domina Pocillopora, con presión turística creciente.', hero: '/images/reefs/huatulco.jpg', imageCredit: 'Foto: Unsplash (ilustrativa) · Datos: CONANP' },
  { id: 11, name: 'Isla Contoy', state: 'Quintana Roo', ocean: 'caribbean', region: 'Sistema Arrecifal Mesoamericano (SAM)', benthicClasses: ['seagrass', 'sand', 'coral_algae'], geomorphicClasses: ['lagoon', 'fringing'], area: 5126, depthRange: [0, 20], protection: 'anp_federal', status: 'watch', liveCoralCover: 21, bleachingAlert: 'watch', speciesRichness: 19, threats: ['tourism_pressure', 'sargassum'], observations: 31, lat: 21.47, lng: -86.79, description: 'Parque Nacional Isla Contoy. Frente al norte del Caribe mexicano, refugio de aves y zona de agregación del tiburón ballena. Acceso turístico restringido.', hero: '/images/reefs/contoy.jpg', imageCredit: 'Foto: Unsplash (ilustrativa) · Datos: CONANP' },
  { id: 12, name: 'Isla Cerralvo / Espíritu Santo', state: 'Baja California Sur', ocean: 'pacific', region: 'Golfo de California', benthicClasses: ['rock', 'coral_algae'], geomorphicClasses: ['fringing', 'patch_reef'], area: 48655, depthRange: [3, 40], protection: 'anp_federal', status: 'healthy', liveCoralCover: 28, bleachingAlert: 'no_stress', speciesRichness: 8, threats: ['thermal_stress', 'tourism_pressure'], observations: 44, lat: 24.50, lng: -110.36, description: 'Parque Nacional Zona Marina Archipiélago de Espíritu Santo. Patrimonio Mundial UNESCO. Comunidades coralinas relictas dominadas por Pocillopora y Porites en muros rocosos.', hero: '/images/reefs/espiritu-santo.jpg', imageCredit: 'Foto: Unsplash (ilustrativa) · Datos: UNESCO / CONANP' },
];

// Galería: 3 imágenes Unsplash adicionales por arrecife (commercial-free).
// El admin puede sobrescribirlas vía PATCH /admin/reefs/:id { gallery: [...] }
const GALLERIES: Record<number, string[]> = {
  1:  G(['1546026423-cc4642628d2b', '1574169208507-84376144848b', '1583212292454-1fe6229603b7']),
  2:  G(['1583212292454-1fe6229603b7', '1605281317010-fe5ffe798166', '1551244072-5d12893278ab']),
  3:  G(['1582967788606-a171c1080cb0', '1559827260-dc66d52bef19', '1546026423-cc4642628d2b']),
  4:  G(['1559827260-dc66d52bef19', '1559128010-7c1ad6e1b6a5', '1518837695005-2083093ee35b']),
  5:  G(['1574169208507-84376144848b', '1582967788606-a171c1080cb0', '1605281317010-fe5ffe798166']),
  6:  G(['1605281317010-fe5ffe798166', '1551244072-5d12893278ab', '1591025207163-942350e47db2']),
  7:  G(['1485451456034-3f9391c6f769', '1546026423-cc4642628d2b', '1574169208507-84376144848b']),
  8:  G(['1551244072-5d12893278ab', '1605281317010-fe5ffe798166', '1591025207163-942350e47db2']),
  9:  G(['1559128010-7c1ad6e1b6a5', '1583212292454-1fe6229603b7', '1559827260-dc66d52bef19']),
  10: G(['1518837695005-2083093ee35b', '1559825481-12a05cc00344', '1574169208507-84376144848b']),
  11: G(['1559825481-12a05cc00344', '1546026423-cc4642628d2b', '1582967788606-a171c1080cb0']),
  12: G(['1591025207163-942350e47db2', '1485451456034-3f9391c6f769', '1551244072-5d12893278ab']),
};

const CONTRIBUTORS = [
  { id: 1, displayName: 'Dra. Adriana Reyes', handle: 'adriana_reyes', role: 'researcher', affiliation: 'CINVESTAV Mérida', state: 'Yucatán', joinedAt: '2024-03-15', tier: 'coral', reputationScore: 1245, validatedContributions: 187, rejectedContributions: 4, acceptanceRate: 0.979, averageQuality: 92, consecutiveMonthsActive: 14, badges: [{ id: 'top1', label: 'Top 1%', icon: 'lucide:crown' }], publicProfile: true, verified: true },
  { id: 2, displayName: 'Coop. Pesquera Vigía Chico', handle: 'vigiachico', role: 'fisher', affiliation: 'Vigía Chico, Quintana Roo', state: 'Quintana Roo', joinedAt: '2024-06-01', tier: 'platinum', reputationScore: 812, validatedContributions: 96, rejectedContributions: 8, acceptanceRate: 0.923, averageQuality: 86, consecutiveMonthsActive: 8, badges: [{ id: 'community', label: 'Comunidad' }], publicProfile: true, verified: true },
  { id: 3, displayName: 'Carlos Méndez', handle: 'carlos_diver', role: 'diver', affiliation: 'Cozumel Dive Pros', state: 'Quintana Roo', joinedAt: '2024-08-12', tier: 'gold', reputationScore: 612, validatedContributions: 71, rejectedContributions: 6, acceptanceRate: 0.922, averageQuality: 81, consecutiveMonthsActive: 6, badges: [], publicProfile: true, verified: false },
  { id: 4, displayName: 'CONANP Veracruz', handle: 'conanp_pnsav', role: 'government', affiliation: 'CONANP — PNSAV', state: 'Veracruz', joinedAt: '2024-04-20', tier: 'platinum', reputationScore: 905, validatedContributions: 112, rejectedContributions: 3, acceptanceRate: 0.974, averageQuality: 90, consecutiveMonthsActive: 12, badges: [{ id: 'institution', label: 'Institución verificada' }], publicProfile: true, verified: true },
  { id: 5, displayName: 'Mariana Solís', handle: 'mari_solis', role: 'student', affiliation: 'UAM-X — Posgrado', state: 'Oaxaca', joinedAt: '2025-01-08', tier: 'silver', reputationScore: 298, validatedContributions: 41, rejectedContributions: 9, acceptanceRate: 0.82, averageQuality: 73, consecutiveMonthsActive: 4, badges: [], publicProfile: true, verified: false },
  { id: 6, displayName: 'Tour Operador Cabo Pulmo', handle: 'cabopulmo_tours', role: 'tour_operator', affiliation: 'Cabo Pulmo', state: 'Baja California Sur', joinedAt: '2024-11-02', tier: 'gold', reputationScore: 532, validatedContributions: 58, rejectedContributions: 5, acceptanceRate: 0.92, averageQuality: 79, consecutiveMonthsActive: 5, badges: [], publicProfile: true, verified: true },
  { id: 7, displayName: 'Iván Pacheco', handle: 'ivan_p', role: 'citizen', state: 'Quintana Roo', joinedAt: '2025-02-14', tier: 'bronze', reputationScore: 88, validatedContributions: 12, rejectedContributions: 4, acceptanceRate: 0.75, averageQuality: 64, consecutiveMonthsActive: 2, badges: [], publicProfile: true, verified: false },
  { id: 8, displayName: 'Healthy Reefs Initiative MX', handle: 'hri_mx', role: 'ngo', affiliation: 'Healthy Reefs Initiative', state: 'Quintana Roo', joinedAt: '2024-02-01', tier: 'coral', reputationScore: 1410, validatedContributions: 213, rejectedContributions: 2, acceptanceRate: 0.991, averageQuality: 94, consecutiveMonthsActive: 15, badges: [{ id: 'ngo', label: 'ONG verificada' }], publicProfile: true, verified: true },
];

const CONFLICTS = [
  { id: 1, title: 'Anclaje de cruceros y daño coralino en Cozumel', summary: 'Cruceros con capacidad de 6,000+ pasajeros generan presión sobre arrecifes someros y bancos coralinos del muelle Punta Langosta.', fullStory: 'El crecimiento exponencial del turismo de cruceros en Cozumel desde 2010 ha incrementado el daño físico por anclas, descargas de aguas grises y derrames ocasionales. Estudios de CONANP documentan reducción del 23% en cobertura coralina en zonas de fondeo.', reefIds: [2], state: 'Quintana Roo', threats: ['cruise_anchoring', 'tourism_pressure', 'nutrient_pollution'], intensity: 'high', status: 'ongoing', affectedCommunities: ['Comunidad maya de San Miguel', 'Cooperativas de buceo locales'], affectedSpecies: ['Acropora palmata', 'Diploria strigosa'], startedAt: '2018-06-01', drivers: ['Líneas navieras (Carnival, Royal Caribbean)', 'FONATUR', 'Concesiones de muelles'], resistance: ['Cooperativa de Buceo Cozumel', 'CONANP', 'Healthy Reefs Initiative'], legalActions: ['Amparo 412/2023 vs ampliación de muelle Punta Langosta'], mediaUrls: ['https://example.com/news1'], contributorId: 8 },
  { id: 2, title: 'Tren Maya y sedimentos en arrecifes del Caribe sur', summary: 'Las obras del Tren Maya tramo 5 generan sedimentos que llegan al SAM vía cenotes y ríos subterráneos.', fullStory: 'Estudios independientes documentan turbidez elevada en arrecifes de Xcalak y Mahahual coincidente con obras del tramo 5. Geólogos advierten que el sistema kárstico transporta sedimentos directamente al mar.', reefIds: [5, 1], state: 'Quintana Roo', threats: ['sedimentation', 'coastal_development'], intensity: 'critical', status: 'ongoing', affectedCommunities: ['Comunidades mayas', 'Pescadores cooperativados'], affectedSpecies: ['Orbicella faveolata', 'Acropora cervicornis'], startedAt: '2022-01-15', drivers: ['FONATUR', 'SEDATU', 'Constructoras federales'], resistance: ['Cenotes Urbanos', 'Sélvame del Tren', 'CEMDA'], legalActions: ['Amparo colectivo 1102/2022', 'Suspensión definitiva (revertida)'], mediaUrls: [], contributorId: 8 },
  { id: 3, title: 'Sobrepesca de mero en Banco Chinchorro', summary: 'La pesca furtiva del mero rojo (Epinephelus morio) durante la temporada de agregación reproductiva amenaza la viabilidad poblacional.', fullStory: 'Reportes de CONAPESCA documentan capturas furtivas en zonas núcleo de la Reserva de la Biosfera durante enero-marzo, periodo crítico para la reproducción del mero rojo.', reefIds: [3], state: 'Quintana Roo', threats: ['overfishing', 'destructive_fishing'], intensity: 'high', status: 'ongoing', affectedCommunities: ['Cooperativa Vigía Chico', 'Cooperativa Andrés Quintana Roo'], affectedSpecies: ['Epinephelus morio'], startedAt: '2020-01-01', drivers: ['Pescadores furtivos', 'Mercado negro'], resistance: ['Cooperativa Vigía Chico', 'CONANP', 'Marina'], mediaUrls: [], contributorId: 2 },
  { id: 4, title: 'Aguas residuales y arrecifes de Huatulco', summary: 'Crecimiento hotelero rebasa la capacidad de tratamiento; descargas afectan bahías Cacaluta y San Agustín.', fullStory: 'El crecimiento de complejos turísticos en Huatulco ha excedido la capacidad de las plantas de tratamiento municipales, generando descargas con elevado contenido de nutrientes que provocan blanqueamiento por estrés osmótico.', reefIds: [10], state: 'Oaxaca', threats: ['nutrient_pollution', 'tourism_pressure'], intensity: 'medium', status: 'ongoing', affectedCommunities: ['Comunidades de Santa María Huatulco'], startedAt: '2019-05-01', drivers: ['Cadenas hoteleras', 'FONATUR'], resistance: ['CONANP Huatulco', 'Comités de cuenca'], mediaUrls: [], contributorId: 4 },
  { id: 5, title: 'Sargazo masivo en el Caribe mexicano', summary: 'Arribazones masivos de sargazo desde 2015 generan hipoxia en lagunas arrecifales y mortalidad de coral.', fullStory: 'El sargazo en descomposición consume oxígeno disuelto y libera ácido sulfhídrico, afectando críticamente las lagunas arrecifales de Puerto Morelos, Akumal y Mahahual.', reefIds: [1, 5, 11], state: 'Quintana Roo', threats: ['sargassum'], intensity: 'high', status: 'ongoing', affectedCommunities: ['Hoteleros', 'Pescadores', 'Comunidades costeras'], startedAt: '2015-04-01', drivers: ['Cambio climático', 'Eutrofización del Atlántico'], resistance: ['SEMAR', 'CONANP', 'Iniciativa privada hotelera'], mediaUrls: [], contributorId: 1 },
  { id: 6, title: 'SCTLD: enfermedad de pérdida de tejido coralino', summary: 'La enfermedad SCTLD ha matado >50% de algunas especies coralinas en el SAM desde 2018.', fullStory: 'La Stony Coral Tissue Loss Disease llegó al Caribe mexicano en 2018 y se ha propagado por todo el SAM. Afecta a más de 25 especies de coral y tiene tasas de mortalidad >70% en colonias infectadas.', reefIds: [1, 2, 3, 5], state: 'Quintana Roo', threats: ['disease_outbreak'], intensity: 'critical', status: 'ongoing', affectedSpecies: ['Pseudodiploria strigosa', 'Colpophyllia natans', 'Dichocoenia stokesii'], startedAt: '2018-07-01', drivers: ['Origen incierto (probablemente aguas de lastre)'], resistance: ['CONANP', 'Healthy Reefs Initiative', 'Universidades'], mediaUrls: [], contributorId: 8 },
];

// 13 capas abiertas iniciales (espejo de `data/layers.ts` del frontend).
// kind = 'external_url' → metadata + sourceUrl/wmsUrl. El admin puede subir
// archivos vía POST /admin/layers/:id/upload (kind cambia a 'uploaded_file').
const LAYERS = [
  { slug: 'noaa-crw-dhw-5km', title: 'NOAA Coral Reef Watch — Degree Heating Weeks (5 km)', description: 'Acumulación de estrés térmico de 12 semanas para predicción de blanqueamiento. Producto operacional global, actualizado diariamente.', kind: 'external_url', provider: 'noaa', providerLabel: 'NOAA Coral Reef Watch', category: 'thermal_stress', format: 'geotiff', resolution: '5 km', cadence: 'diaria', coverage: 'global', license: 'Public Domain (NOAA)', attribution: 'NOAA Coral Reef Watch. (2024). Daily Global 5km Satellite Coral Bleaching Heat Stress Monitoring. NOAA/NESDIS.', sourceUrl: 'https://coralreefwatch.noaa.gov/product/5km/index.php', downloadUrl: 'https://coralreefwatch.noaa.gov/data/5km/', previewUrl: 'https://coralreefwatch.noaa.gov/product/5km/v3.1_op/composite/', lastUpdated: '2026-04-27', active: true, sortOrder: 1 },
  { slug: 'noaa-crw-bleaching-alert', title: 'NOAA CRW — Bleaching Alert Area (5 km)', description: 'Niveles de alerta operacionales (No Stress / Watch / Warning / Alert 1 / Alert 2) basados en SST y DHW.', kind: 'external_url', provider: 'noaa', providerLabel: 'NOAA Coral Reef Watch', category: 'thermal_stress', format: 'wms', resolution: '5 km', cadence: 'diaria', coverage: 'global', license: 'Public Domain (NOAA)', attribution: 'NOAA Coral Reef Watch (2024).', sourceUrl: 'https://coralreefwatch.noaa.gov/product/5km/index_5km_baa-max-7d.php', wmsUrl: 'https://coastwatch.pfeg.noaa.gov/erddap/wms/NOAA_DHW/request', wmsLayerName: 'NOAA_DHW:CRW_BAA_max_7d', overlayOpacity: 0.65, lastUpdated: '2026-04-27', active: true, sortOrder: 2 },
  { slug: 'nasa-modis-sst', title: 'NASA MODIS — Sea Surface Temperature (Aqua, 4 km)', description: 'Temperatura superficial del mar diurna y nocturna. Producto MYD28 / MOD28 procesado por OB.DAAC.', kind: 'external_url', provider: 'nasa', providerLabel: 'NASA OB.DAAC', category: 'thermal_stress', format: 'geotiff', resolution: '4 km', cadence: 'diaria', coverage: 'global', license: 'Public Domain (NASA)', attribution: 'NASA Goddard Space Flight Center, OB.DAAC, MODIS-Aqua SST L3.', sourceUrl: 'https://oceancolor.gsfc.nasa.gov/l3/', lastUpdated: '2026-04-27', active: true, sortOrder: 3 },
  { slug: 'nasa-pace-chla', title: 'NASA PACE — Clorofila-a (1 km)', description: 'Concentración de clorofila-a derivada del satélite PACE (Plankton, Aerosol, Cloud, ocean Ecosystem). Indicador de productividad y aportes nutritivos.', kind: 'external_url', provider: 'nasa', providerLabel: 'NASA PACE', category: 'water_quality', format: 'geotiff', resolution: '1 km', cadence: 'diaria', coverage: 'global', license: 'Public Domain (NASA)', attribution: 'NASA PACE Mission, OCI L2 OC products.', sourceUrl: 'https://pace.oceansciences.org/data.htm', lastUpdated: '2026-04-25', active: true, sortOrder: 4 },
  { slug: 'esa-sentinel2-l2a', title: 'ESA Sentinel-2 L2A — Reflectancia superficial (10 m)', description: 'Imágenes ópticas multiespectrales para mapeo de hábitats bentónicos someros, sargazo y turbidez.', kind: 'external_url', provider: 'esa_copernicus', providerLabel: 'ESA Copernicus', category: 'benthic_habitat', format: 'cog', resolution: '10 m', cadence: '5 días', coverage: 'global', license: 'Copernicus Open Data', attribution: 'Contains modified Copernicus Sentinel-2 L2A data (2024).', sourceUrl: 'https://dataspace.copernicus.eu/', lastUpdated: '2026-04-26', active: true, sortOrder: 5 },
  { slug: 'allen-coral-atlas-benthic', title: 'Allen Coral Atlas — Mapas bentónicos globales', description: 'Clasificación bentónica global a 5 m derivada de Planet Dove + machine learning. Coral/algas, roca, escombros, arena, pasto marino, microalgas.', kind: 'external_url', provider: 'allen_coral_atlas', providerLabel: 'Allen Coral Atlas', category: 'benthic_habitat', format: 'geotiff', resolution: '5 m', cadence: 'estática (v2.0)', coverage: 'global', license: 'CC BY 4.0', attribution: 'Allen Coral Atlas (2022). Imagery, maps and monitoring of the world\'s tropical coral reefs. Arizona State University.', sourceUrl: 'https://allencoralatlas.org/', downloadUrl: 'https://allencoralatlas.org/atlas/', lastUpdated: '2024-12-01', active: true, sortOrder: 6 },
  { slug: 'gebco-bathymetry', title: 'GEBCO 2024 — Batimetría global (15 arcsec)', description: 'Modelo digital de elevación oceánica. Profundidad referencia para hábitats arrecifales.', kind: 'external_url', provider: 'noaa', providerLabel: 'GEBCO / IHO-IOC', category: 'bathymetry', format: 'geotiff', resolution: '~450 m', cadence: 'anual', coverage: 'global', license: 'CC BY 4.0', attribution: 'GEBCO Compilation Group (2024). GEBCO 2024 Grid.', sourceUrl: 'https://www.gebco.net/', wmsUrl: 'https://wms.gebco.net/mapserv', wmsLayerName: 'GEBCO_LATEST', overlayOpacity: 0.55, lastUpdated: '2024-09-01', active: false, sortOrder: 7 },
  { slug: 'conabio-anp-marinas', title: 'CONABIO — Áreas Naturales Protegidas marinas', description: 'Polígonos oficiales de ANP federales y estatales con componente marino.', kind: 'external_url', provider: 'conabio', providerLabel: 'CONABIO', category: 'protected_areas', format: 'shapefile', coverage: 'national', license: 'CC BY 4.0', attribution: 'CONABIO (2024). Áreas Naturales Protegidas Federales de México.', sourceUrl: 'http://geoportal.conabio.gob.mx/', downloadUrl: 'http://geoportal.conabio.gob.mx/metadatos/doc/html/anpfedmay24gw.html', wmsUrl: 'http://geoportal.conabio.gob.mx/geoserver/wms', wmsLayerName: 'CONABIO:anpfedmay24gw', overlayOpacity: 0.5, lastUpdated: '2024-05-01', active: true, sortOrder: 8 },
  { slug: 'conabio-arrecifes-coralinos', title: 'CONABIO — Arrecifes coralinos de México', description: 'Inventario nacional de formaciones arrecifales (Caribe, Golfo de México, Pacífico).', kind: 'external_url', provider: 'conabio', providerLabel: 'CONABIO', category: 'benthic_habitat', format: 'shapefile', coverage: 'national', license: 'CC BY 4.0', attribution: 'CONABIO (2018). Arrecifes coralinos de México. Geoportal SNIB.', sourceUrl: 'http://geoportal.conabio.gob.mx/', lastUpdated: '2018-12-01', active: true, sortOrder: 9 },
  { slug: 'conanp-decretos', title: 'CONANP — Decretos y zonificación', description: 'Zonificación interna de cada ANP marina (núcleo, amortiguamiento, uso restringido).', kind: 'external_url', provider: 'conanp', providerLabel: 'CONANP', category: 'protected_areas', format: 'shapefile', coverage: 'national', license: 'Datos Abiertos México', attribution: 'CONANP (2024). Comisión Nacional de Áreas Naturales Protegidas.', sourceUrl: 'https://www.gob.mx/conanp', lastUpdated: '2024-08-15', active: false, sortOrder: 10 },
  { slug: 'gfw-fishing-effort', title: 'Global Fishing Watch — Esfuerzo pesquero (AIS)', description: 'Horas de pesca aparente derivadas de AIS. Útil para detectar pesca dentro de ANP.', kind: 'external_url', provider: 'global_fishing_watch', providerLabel: 'Global Fishing Watch', category: 'fishing_pressure', format: 'geotiff', resolution: '0.01°', cadence: 'diaria', coverage: 'global', license: 'CC BY-NC 4.0', attribution: 'Global Fishing Watch (2024). Apparent Fishing Effort.', sourceUrl: 'https://globalfishingwatch.org/data-download/', lastUpdated: '2026-04-26', active: false, sortOrder: 11 },
  { slug: 'noaa-sargassum-watch', title: 'NOAA / USF — Sargassum Watch System (1 km)', description: 'Detección semanal de sargazo flotante en el Caribe y Golfo. MODIS + VIIRS.', kind: 'external_url', provider: 'noaa', providerLabel: 'NOAA / Univ. South Florida OOL', category: 'water_quality', format: 'geotiff', resolution: '1 km', cadence: 'semanal', coverage: 'regional', license: 'Public Domain (NOAA)', attribution: 'USF Optical Oceanography Lab / NOAA SaWS (2024).', sourceUrl: 'https://optics.marine.usf.edu/projects/saws.html', lastUpdated: '2026-04-22', active: true, sortOrder: 12 },
  { slug: 'inegi-uso-suelo-costero', title: 'INEGI — Uso del suelo y vegetación costera (Serie VII)', description: 'Cobertura terrestre 1:250,000 incluyendo manglares, dunas y cuerpos de agua.', kind: 'external_url', provider: 'inegi', providerLabel: 'INEGI', category: 'land_use', format: 'shapefile', coverage: 'national', license: 'Datos Abiertos México', attribution: 'INEGI (2023). Carta de Uso del Suelo y Vegetación, Serie VII.', sourceUrl: 'https://www.inegi.org.mx/temas/usosuelo/', lastUpdated: '2023-06-01', active: false, sortOrder: 13 },
];

const TIERS = [
  { slug: 'bronze', label: 'Bronce', minScore: 0, maxScore: 199, color: 'amber', icon: 'lucide:medal',
    description: 'Inicial. Hasta 199 puntos.',
    requirements: 'Primer aporte validado.', sortOrder: 1 },
  { slug: 'silver', label: 'Plata', minScore: 200, maxScore: 499, color: 'slate', icon: 'lucide:medal',
    description: '200–499 puntos.',
    requirements: '30+ aportes validados.', sortOrder: 2 },
  { slug: 'gold', label: 'Oro', minScore: 500, maxScore: 699, color: 'yellow', icon: 'lucide:medal',
    description: '500–699 puntos.',
    requirements: '60+ aportes, calidad ≥75%, 3+ meses activo.', sortOrder: 3 },
  { slug: 'platinum', label: 'Platino', minScore: 700, maxScore: 999, color: 'cyan', icon: 'lucide:gem',
    description: '700–999 puntos.',
    requirements: '90+ aportes, calidad ≥85%, 6+ meses activo.', sortOrder: 4 },
  { slug: 'coral', label: 'Coral', minScore: 1000, maxScore: null, color: 'coral', icon: 'lucide:crown',
    description: 'Top 1%. 1000+ puntos.',
    requirements: 'Identidad y trayectoria verificadas.', sortOrder: 5 },
];

export async function seedArrecifes() {
  const reefRepo = AppDataSource.getRepository(ObsReef);
  const contributorRepo = AppDataSource.getRepository(ObsContributor);
  const conflictRepo = AppDataSource.getRepository(ObsConflict);
  const tierRepo = AppDataSource.getRepository(ObsTier);
  const layerRepo = AppDataSource.getRepository(ObsLayer);

  // Reefs
  for (const r of REEFS) {
    const existing = await reefRepo.findOne({ where: { id: r.id } });
    const data: any = { ...r, depthRange: r.depthRange as any, gallery: GALLERIES[r.id] || null };
    if (existing) {
      Object.assign(existing, data);
      await reefRepo.save(existing);
    } else {
      await reefRepo.save(reefRepo.create(data));
    }
  }

  // Contributors
  for (const c of CONTRIBUTORS) {
    const existing = await contributorRepo.findOne({ where: { id: c.id } });
    if (existing) {
      Object.assign(existing, c);
      await contributorRepo.save(existing);
    } else {
      await contributorRepo.save(contributorRepo.create(c as any));
    }
  }

  // Conflicts
  for (const k of CONFLICTS) {
    const existing = await conflictRepo.findOne({ where: { id: k.id } });
    if (existing) {
      Object.assign(existing, k);
      await conflictRepo.save(existing);
    } else {
      await conflictRepo.save(conflictRepo.create(k as any));
    }
  }

  // Tiers (escala reputacional)
  for (const t of TIERS) {
    const existing = await tierRepo.findOne({ where: { slug: t.slug } });
    if (existing) {
      Object.assign(existing, t);
      await tierRepo.save(existing);
    } else {
      await tierRepo.save(tierRepo.create(t as any));
    }
  }

  // Layers (catálogo de capas abiertas — espejo del frontend mock)
  for (const l of LAYERS) {
    const existing = await layerRepo.findOne({ where: { slug: l.slug } });
    if (existing) {
      Object.assign(existing, l);
      await layerRepo.save(existing);
    } else {
      await layerRepo.save(layerRepo.create(l as any));
    }
  }

  console.log(
    `✅ Seeded arrecifes: ${REEFS.length} reefs, ${CONTRIBUTORS.length} contributors, ${CONFLICTS.length} conflicts, ${TIERS.length} tiers, ${LAYERS.length} layers`,
  );
}
