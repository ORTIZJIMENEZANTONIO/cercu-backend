import Joi from 'joi';

export const reefSchema = Joi.object({
  name: Joi.string().required(),
  state: Joi.string().required(),
  ocean: Joi.string().valid('caribbean', 'gulf_of_mexico', 'pacific').required(),
  region: Joi.string().allow('', null).optional(),
  benthicClasses: Joi.array().items(Joi.string()).optional(),
  geomorphicClasses: Joi.array().items(Joi.string()).optional(),
  area: Joi.number().min(0).optional(),
  depthRange: Joi.array().length(2).items(Joi.number()).optional(),
  protection: Joi.string().valid('anp_federal', 'anp_state', 'ramsar', 'unesco', 'unprotected').default('unprotected'),
  status: Joi.string().valid('healthy', 'watch', 'warning', 'alert', 'bleaching', 'mortality').default('healthy'),
  liveCoralCover: Joi.number().min(0).max(100).optional(),
  bleachingAlert: Joi.string().valid('no_stress', 'watch', 'warning', 'alert_1', 'alert_2').allow(null).optional(),
  speciesRichness: Joi.number().integer().min(0).optional(),
  threats: Joi.array().items(Joi.string()).optional(),
  observations: Joi.number().integer().min(0).default(0),
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  description: Joi.string().allow('', null).optional(),
  hero: Joi.string().allow('', null).optional(),
  gallery: Joi.array().items(Joi.string()).max(3).optional(),
  imageCredit: Joi.string().allow('', null).optional(),
  visible: Joi.boolean().default(true),
  archived: Joi.boolean().default(false),
});

export const conflictSchema = Joi.object({
  title: Joi.string().required(),
  summary: Joi.string().required(),
  fullStory: Joi.string().allow('', null).optional(),
  reefIds: Joi.array().items(Joi.number().integer()).optional(),
  state: Joi.string().required(),
  threats: Joi.array().items(Joi.string()).optional(),
  intensity: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  status: Joi.string().valid('emerging', 'ongoing', 'mitigating', 'resolved').default('ongoing'),
  affectedCommunities: Joi.array().items(Joi.string()).optional(),
  affectedSpecies: Joi.array().items(Joi.string()).optional(),
  startedAt: Joi.string().allow(null, '').optional(),
  drivers: Joi.array().items(Joi.string()).optional(),
  resistance: Joi.array().items(Joi.string()).optional(),
  legalActions: Joi.array().items(Joi.string()).optional(),
  mediaUrls: Joi.array().items(Joi.string()).optional(),
  geometry: Joi.object({
    type: Joi.string()
      .valid('Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon')
      .required(),
    coordinates: Joi.array().required(),
  })
    .allow(null)
    .optional(),
  contributorId: Joi.number().integer().allow(null).optional(),
  visible: Joi.boolean().default(true),
  archived: Joi.boolean().default(false),
});

export const contributorSchema = Joi.object({
  displayName: Joi.string().required(),
  handle: Joi.string().pattern(/^[a-z0-9_-]+$/i).required(),
  role: Joi.string().valid('citizen', 'researcher', 'student', 'fisher', 'diver', 'tour_operator', 'institution', 'ngo', 'government').default('citizen'),
  affiliation: Joi.string().allow('', null).optional(),
  bio: Joi.string().allow('', null).optional(),
  avatarUrl: Joi.string().allow('', null).optional(),
  state: Joi.string().allow('', null).optional(),
  joinedAt: Joi.string().allow(null, '').optional(),
  tier: Joi.string().valid('bronze', 'silver', 'gold', 'platinum', 'coral').default('bronze'),
  reputationScore: Joi.number().integer().min(0).default(0),
  validatedContributions: Joi.number().integer().min(0).default(0),
  rejectedContributions: Joi.number().integer().min(0).default(0),
  acceptanceRate: Joi.number().min(0).max(1).default(0),
  averageQuality: Joi.number().min(0).max(100).default(0),
  consecutiveMonthsActive: Joi.number().integer().min(0).default(0),
  badges: Joi.array().items(Joi.object()).optional(),
  publicProfile: Joi.boolean().default(true),
  verified: Joi.boolean().default(false),
  visible: Joi.boolean().default(true),
  archived: Joi.boolean().default(false),
});

export const observationSubmitSchema = Joi.object({
  reefId: Joi.number().integer().allow(null).optional(),
  type: Joi.string().valid('satellite_image', 'drone_flight', 'underwater_photo', 'transect_survey', 'water_sample', 'community_report', 'socioenvironmental_conflict').required(),
  title: Joi.string().required(),
  description: Joi.string().required(),
  contributorId: Joi.number().integer().required(),
  capturedAt: Joi.string().required(),
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  attachments: Joi.array().items(Joi.object()).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
});

export const observationReviewSchema = Joi.object({
  status: Joi.string().valid('validated', 'rejected', 'needs_more_info', 'in_review').required(),
  reviewerNotes: Joi.string().allow('', null).optional(),
  qualityScore: Joi.number().integer().min(0).max(100).optional(),
});

export const bleachingAlertSchema = Joi.object({
  reefId: Joi.number().integer().required(),
  level: Joi.string().valid('no_stress', 'watch', 'warning', 'alert_1', 'alert_2').required(),
  dhw: Joi.number().min(0).optional(),
  sst: Joi.number().optional(),
  sstAnomaly: Joi.number().optional(),
  observedAt: Joi.string().required(),
  source: Joi.string().default('noaa_crw'),
  productUrl: Joi.string().allow('', null).optional(),
});

const layerFormats = ['wms', 'wmts', 'geotiff', 'shapefile', 'geojson', 'kml', 'csv', 'cog'] as const;
const layerCategories = [
  'thermal_stress',
  'bathymetry',
  'benthic_habitat',
  'water_quality',
  'protected_areas',
  'land_use',
  'fishing_pressure',
  'community_observations',
] as const;

export const tierSchema = Joi.object({
  slug: Joi.string()
    .pattern(/^[a-z0-9-]+$/)
    .min(2)
    .max(50)
    .required(),
  label: Joi.string().required(),
  description: Joi.string().allow('', null).optional(),
  minScore: Joi.number().integer().min(0).default(0),
  maxScore: Joi.number().integer().min(0).allow(null).optional(),
  color: Joi.string().default('slate'),
  requirements: Joi.string().allow('', null).optional(),
  icon: Joi.string().allow('', null).optional(),
  sortOrder: Joi.number().integer().default(0),
  visible: Joi.boolean().default(true),
  archived: Joi.boolean().default(false),
});

export const layerSchema = Joi.object({
  slug: Joi.string()
    .pattern(/^[a-z0-9-]+$/)
    .min(3)
    .max(100)
    .required(),
  title: Joi.string().required(),
  description: Joi.string().allow('', null).optional(),
  kind: Joi.string().valid('external_url', 'uploaded_file').default('external_url'),
  provider: Joi.string().required(),
  providerLabel: Joi.string().required(),
  category: Joi.string()
    .valid(...layerCategories)
    .required(),
  format: Joi.string()
    .valid(...layerFormats)
    .required(),
  resolution: Joi.string().allow('', null).optional(),
  cadence: Joi.string().allow('', null).optional(),
  coverage: Joi.string().valid('global', 'regional', 'national').default('regional'),
  license: Joi.string().required(),
  attribution: Joi.string().required(),
  sourceUrl: Joi.string().uri().allow('', null).optional(),
  downloadUrl: Joi.string().uri().allow('', null).optional(),
  previewUrl: Joi.string().uri().allow('', null).optional(),
  wmsUrl: Joi.string().uri().allow('', null).optional(),
  wmsLayerName: Joi.string().allow('', null).optional(),
  tileUrlPattern: Joi.string().allow('', null).optional(),
  overlayOpacity: Joi.number().min(0).max(1).default(0.7),
  lastUpdated: Joi.string().allow('', null).optional(),
  active: Joi.boolean().default(true),
  visible: Joi.boolean().default(true),
  archived: Joi.boolean().default(false),
  sortOrder: Joi.number().integer().default(0),
});
