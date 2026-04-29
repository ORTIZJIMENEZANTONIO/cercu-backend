import { AppDataSource } from '../ormconfig';
import { ObsObservation } from '../entities/observatory/Observation';

// 6 observaciones de muestra cubriendo todos los estados del workflow de
// revisión (pending / in_review / validated / rejected / needs_more_info).
// Permite demostrar la cola de revisión en `/admin/observations` desde el primer arranque.
const OBSERVATIONS = [
  {
    id: 1,
    reefId: 2,
    type: 'underwater_photo',
    title: 'Coral cerebro con SCTLD activo en Cozumel',
    description:
      'Documentación de Pseudodiploria strigosa con lesiones de Stony Coral Tissue Loss Disease en Paraíso Reef, ~12 m de profundidad. Coral parcialmente afectado, recomienda monitoreo seguimiento.',
    contributorId: 3,
    capturedAt: new Date('2026-04-15T10:30:00'),
    submittedAt: new Date('2026-04-15T18:42:00'),
    lat: 20.39,
    lng: -86.97,
    attachments: [
      { id: 1, kind: 'image', url: '/images/reefs/cozumel.jpg', caption: 'Lesión SCTLD en cerebro' },
    ],
    tags: ['SCTLD', 'Cozumel', 'enfermedad'],
    status: 'validated',
    reviewerId: null,
    reviewerNotes: 'Identificación correcta, foto de buena resolución. Reportado a Healthy Reefs.',
    validatedAt: new Date('2026-04-16T09:15:00'),
    qualityScore: 85,
  },
  {
    id: 2,
    reefId: 1,
    type: 'community_report',
    title: 'Arribazón de sargazo masivo en Puerto Morelos',
    description:
      'Acumulación de ~1.5 m de altura de sargazo en la playa norte del muelle, observado en la mañana. Hipoxia visible en el agua de la laguna arrecifal.',
    contributorId: 7,
    capturedAt: new Date('2026-04-22T07:00:00'),
    submittedAt: new Date('2026-04-22T08:30:00'),
    lat: 20.85,
    lng: -86.87,
    attachments: [],
    tags: ['sargazo', 'hipoxia', 'PuertoMorelos'],
    status: 'pending',
  },
  {
    id: 3,
    reefId: 3,
    type: 'transect_survey',
    title: 'Transecto bentónico Cayo Centro — abril 2026',
    description:
      'Transecto LIT 50m x 4 réplicas. Cobertura coral viva 24%, algas 31%, arena 28%. Notable presencia de Acropora palmata juvenil en zona somera.',
    contributorId: 1,
    capturedAt: new Date('2026-04-08T14:00:00'),
    submittedAt: new Date('2026-04-09T20:15:00'),
    lat: 18.62,
    lng: -87.32,
    attachments: [
      { id: 2, kind: 'dataset', url: '#', caption: 'CSV transectos' },
    ],
    tags: ['transecto', 'LIT', 'Chinchorro'],
    status: 'validated',
    reviewerId: null,
    reviewerNotes: 'Metodología sólida, datos consistentes con HRI 2025.',
    validatedAt: new Date('2026-04-10T11:00:00'),
    qualityScore: 94,
  },
  {
    id: 4,
    reefId: 6,
    type: 'drone_flight',
    title: 'Mapa fotogramétrico Los Frailes (Cabo Pulmo)',
    description:
      'Vuelo dron 80 m altura, 200 fotos overlap 80%. Ortomosaico 5 cm/px de la zona arrecifal Los Frailes.',
    contributorId: 6,
    capturedAt: new Date('2026-04-05T10:00:00'),
    submittedAt: new Date('2026-04-06T19:30:00'),
    lat: 23.45,
    lng: -109.43,
    attachments: [
      { id: 3, kind: 'image', url: '/images/reefs/cabo-pulmo.jpg', caption: 'Ortomosaico preliminar' },
    ],
    tags: ['dron', 'fotogrametría', 'CaboPulmo'],
    status: 'in_review',
  },
  {
    id: 5,
    reefId: 4,
    type: 'water_sample',
    title: 'Muestreo de turbidez post-norte SAV',
    description:
      'Muestreos en 3 sitios del PNSAV tras el frente frío del 18 de abril. Turbidez 8.4 NTU, encima del umbral SEMARNAT.',
    contributorId: 4,
    capturedAt: new Date('2026-04-19T09:00:00'),
    submittedAt: new Date('2026-04-20T13:45:00'),
    lat: 19.18,
    lng: -96.10,
    attachments: [],
    tags: ['turbidez', 'SAV', 'frente-frío'],
    status: 'needs_more_info',
    reviewerId: null,
    reviewerNotes: 'Falta ubicación GPS de cada uno de los 3 sitios. Por favor adjunta coordenadas.',
  },
  {
    id: 6,
    reefId: 10,
    type: 'community_report',
    title: 'Avistamiento de blanqueamiento en La Entrega',
    description:
      'Coral blanqueado parcial en bahía La Entrega. Aproximadamente 30% de las colonias visibles. SST sentido alta.',
    contributorId: 7,
    capturedAt: new Date('2026-04-25T11:00:00'),
    submittedAt: new Date('2026-04-25T15:20:00'),
    lat: 15.72,
    lng: -96.13,
    attachments: [],
    tags: ['blanqueamiento', 'Huatulco'],
    status: 'rejected',
    reviewerId: null,
    reviewerNotes: 'Sin foto adjunta y sin coordenadas precisas. No verificable. Reenvía con evidencia gráfica.',
  },
];

export async function seedArrecifesObservations() {
  const repo = AppDataSource.getRepository(ObsObservation);
  for (const o of OBSERVATIONS) {
    const existing = await repo.findOne({ where: { id: o.id } });
    if (existing) {
      Object.assign(existing, o);
      await repo.save(existing);
    } else {
      await repo.save(repo.create(o as any));
    }
  }
  console.log(`✅ Seeded arrecifes-observations: ${OBSERVATIONS.length} observaciones`);
}
