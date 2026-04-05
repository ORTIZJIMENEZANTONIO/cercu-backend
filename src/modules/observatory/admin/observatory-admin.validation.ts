import Joi from 'joi';

// ---------- Prospectos ----------
export const submitProspectSchema = Joi.object({
  data: Joi.object().required(),
  source: Joi.string().valid('ia_detector', 'manual', 'externo').default('manual'),
  confianzaDetector: Joi.string().allow(null, '').optional(),
});

export const rejectProspectSchema = Joi.object({
  notas: Joi.string().required(),
});

// ---------- Techos Verdes: Green Roofs ----------
export const greenRoofSchema = Joi.object({
  nombre: Joi.string().required(),
  alcaldia: Joi.string().required(),
  direccion: Joi.string().allow('').optional(),
  tipoEdificio: Joi.string().required(),
  tipoTechoVerde: Joi.string().valid('extensivo', 'intensivo', 'semi-intensivo').required(),
  superficie: Joi.number().positive().required(),
  estado: Joi.string().valid('activo', 'mantenimiento', 'inactivo', 'nuevo').default('nuevo'),
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  imagen: Joi.string().allow(null, '').optional(),
  descripcion: Joi.string().allow('').optional(),
});

// ---------- Techos Verdes: Candidates ----------
export const candidateRoofSchema = Joi.object({
  nombre: Joi.string().required(),
  alcaldia: Joi.string().required(),
  direccion: Joi.string().allow('').optional(),
  tipoEdificio: Joi.string().required(),
  superficie: Joi.number().positive().required(),
  scoreAptitud: Joi.number().min(0).max(100).required(),
  estatus: Joi.string().valid('candidato', 'validado_visualmente', 'factibilidad_pendiente', 'piloto', 'implementado').default('candidato'),
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  imagen: Joi.string().allow(null, '').optional(),
  variables: Joi.object().optional(),
  confianzaIA: Joi.string().valid('alta', 'media', 'baja').optional(),
});

// ---------- Techos Verdes: Validations ----------
export const validationRecordSchema = Joi.object({
  candidatoId: Joi.number().optional(),
  nombre: Joi.string().required(),
  imagen: Joi.string().allow(null, '').optional(),
  prediccion: Joi.string().allow('').optional(),
  confianza: Joi.string().valid('alta', 'media', 'baja').optional(),
  porcentajeConfianza: Joi.number().min(0).max(100).optional(),
  estado: Joi.string().valid('pendiente', 'confirmado', 'rechazado', 'indeterminado', 'pendiente_reconciliacion').default('pendiente'),
  revisadoPor: Joi.string().allow(null, '').optional(),
});

// ---------- Humedales ----------
export const humedalSchema = Joi.object({
  nombre: Joi.string().required(),
  alcaldia: Joi.string().required(),
  ubicacion: Joi.string().allow('').optional(),
  tipoHumedal: Joi.string().valid('conservacion', 'tratamiento_aguas', 'recreativo', 'captacion_pluvial', 'restauracion_hidrologica').required(),
  funcionPrincipal: Joi.string().required(),
  superficie: Joi.number().positive().optional(),
  volumen: Joi.number().positive().optional(),
  capacidadTratamiento: Joi.string().allow('').optional(),
  anioImplementacion: Joi.string().required(),
  vegetacion: Joi.array().items(Joi.string()).optional(),
  sustrato: Joi.string().allow('').optional(),
  usoAgua: Joi.string().allow('').optional(),
  serviciosEcosistemicos: Joi.array().items(Joi.string()).optional(),
  serviciosDescripcion: Joi.array().items(Joi.string()).optional(),
  monitoreo: Joi.string().allow('').optional(),
  estado: Joi.string().valid('activo', 'en_construccion', 'en_expansion', 'piloto').default('activo'),
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  imagen: Joi.string().allow(null, '').optional(),
});

// ---------- Hallazgos ----------
export const hallazgoSchema = Joi.object({
  titulo: Joi.string().required(),
  descripcion: Joi.string().required(),
  evidencia: Joi.array().items(Joi.string()).optional(),
  impacto: Joi.string().valid('alto', 'medio', 'critico').required(),
  recomendacion: Joi.object({
    titulo: Joi.string().required(),
    descripcion: Joi.string().required(),
    acciones: Joi.array().items(Joi.string()).optional(),
    responsables: Joi.array().items(Joi.string()).optional(),
    plazo: Joi.string().valid('corto', 'mediano', 'largo').required(),
    costoEstimado: Joi.string().allow('').optional(),
  }).required(),
});
