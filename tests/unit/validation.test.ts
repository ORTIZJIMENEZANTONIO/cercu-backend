import { describe, it, expect } from 'vitest'
import {
  humedalSchema,
  hallazgoSchema,
  submitProspectSchema,
  rejectProspectSchema,
  greenRoofSchema,
  candidateRoofSchema,
  validationRecordSchema,
} from '../../src/modules/observatory/admin/observatory-admin.validation'

describe('Validation Schemas — Humedal', () => {
  const validHumedal = {
    nombre: 'Humedal Artificial Test',
    alcaldia: 'Iztapalapa',
    tipoHumedal: 'ha_fws',
    funcionPrincipal: 'Tratamiento de agua',
    anioImplementacion: '2024',
    lat: 19.36,
    lng: -99.04,
  }

  it('accepts valid humedal', () => {
    const { error } = humedalSchema.validate(validHumedal)
    expect(error).toBeUndefined()
  })

  it('rejects missing nombre', () => {
    const { error } = humedalSchema.validate({ ...validHumedal, nombre: undefined })
    expect(error).toBeDefined()
    expect(error!.details[0].path).toContain('nombre')
  })

  it('rejects missing alcaldia', () => {
    const { error } = humedalSchema.validate({ ...validHumedal, alcaldia: undefined })
    expect(error).toBeDefined()
  })

  it('rejects invalid tipoHumedal', () => {
    const { error } = humedalSchema.validate({ ...validHumedal, tipoHumedal: 'invalid' })
    expect(error).toBeDefined()
    expect(error!.details[0].path).toContain('tipoHumedal')
  })

  it('accepts all valid tipoHumedal values', () => {
    const types = ['ha_fws', 'ha_sfs_horizontal', 'ha_sfs_vertical', 'ha_hibrido']
    types.forEach(tipo => {
      const { error } = humedalSchema.validate({ ...validHumedal, tipoHumedal: tipo })
      expect(error).toBeUndefined()
    })
  })

  it('rejects lat out of range', () => {
    const { error } = humedalSchema.validate({ ...validHumedal, lat: 200 })
    expect(error).toBeDefined()
  })

  it('rejects lng out of range', () => {
    const { error } = humedalSchema.validate({ ...validHumedal, lng: -200 })
    expect(error).toBeDefined()
  })

  it('accepts optional fields', () => {
    const full = {
      ...validHumedal,
      ubicacion: 'Parque',
      superficie: 1000,
      volumen: 500,
      capacidadTratamiento: '100 m³/d',
      vegetacion: ['Typha', 'Juncus'],
      sustrato: 'Grava',
      usoAgua: 'Riego',
      serviciosEcosistemicos: ['depuracion_agua'],
      serviciosDescripcion: ['Desc'],
      monitoreo: 'Sin datos',
      estado: 'activo',
      imagen: 'https://example.com/img.jpg',
    }
    const { error } = humedalSchema.validate(full)
    expect(error).toBeUndefined()
  })

  it('rejects negative superficie', () => {
    const { error } = humedalSchema.validate({ ...validHumedal, superficie: -100 })
    expect(error).toBeDefined()
  })

  it('accepts all valid estado values', () => {
    const estados = ['activo', 'en_construccion', 'en_expansion', 'piloto']
    estados.forEach(estado => {
      const { error } = humedalSchema.validate({ ...validHumedal, estado })
      expect(error).toBeUndefined()
    })
  })

  it('defaults estado to activo', () => {
    const { value } = humedalSchema.validate(validHumedal)
    expect(value.estado).toBe('activo')
  })
})

describe('Validation Schemas — Hallazgo', () => {
  const validHallazgo = {
    titulo: 'Hallazgo test',
    descripcion: 'Descripcion del hallazgo',
    impacto: 'alto',
    recomendacion: {
      titulo: 'Recomendacion test',
      descripcion: 'Desc recomendacion',
      plazo: 'corto',
    },
  }

  it('accepts valid hallazgo', () => {
    const { error } = hallazgoSchema.validate(validHallazgo)
    expect(error).toBeUndefined()
  })

  it('rejects missing titulo', () => {
    const { error } = hallazgoSchema.validate({ ...validHallazgo, titulo: undefined })
    expect(error).toBeDefined()
  })

  it('rejects invalid impacto', () => {
    const { error } = hallazgoSchema.validate({ ...validHallazgo, impacto: 'invalid' })
    expect(error).toBeDefined()
  })

  it('accepts all valid impacto values', () => {
    ['alto', 'medio', 'critico'].forEach(impacto => {
      const { error } = hallazgoSchema.validate({ ...validHallazgo, impacto })
      expect(error).toBeUndefined()
    })
  })

  it('rejects missing recomendacion', () => {
    const { error } = hallazgoSchema.validate({ ...validHallazgo, recomendacion: undefined })
    expect(error).toBeDefined()
  })

  it('rejects recomendacion without plazo', () => {
    const { error } = hallazgoSchema.validate({
      ...validHallazgo,
      recomendacion: { titulo: 'T', descripcion: 'D' },
    })
    expect(error).toBeDefined()
  })

  it('accepts all valid plazo values', () => {
    ['corto', 'mediano', 'largo'].forEach(plazo => {
      const { error } = hallazgoSchema.validate({
        ...validHallazgo,
        recomendacion: { ...validHallazgo.recomendacion, plazo },
      })
      expect(error).toBeUndefined()
    })
  })

  it('accepts optional arrays', () => {
    const full = {
      ...validHallazgo,
      evidencia: ['Ev1', 'Ev2'],
      recomendacion: {
        ...validHallazgo.recomendacion,
        acciones: ['Accion 1'],
        responsables: ['SEDEMA'],
        costoEstimado: '$1,000,000 MXN',
      },
    }
    const { error } = hallazgoSchema.validate(full)
    expect(error).toBeUndefined()
  })
})

describe('Validation Schemas — Prospecto', () => {
  it('accepts valid submission', () => {
    const { error } = submitProspectSchema.validate({
      data: { nombre: 'Test', lat: 19.4, lng: -99.1 },
      source: 'manual',
    })
    expect(error).toBeUndefined()
  })

  it('rejects missing data', () => {
    const { error } = submitProspectSchema.validate({ source: 'manual' })
    expect(error).toBeDefined()
  })

  it('accepts valid sources', () => {
    ['ia_detector', 'manual', 'externo'].forEach(source => {
      const { error } = submitProspectSchema.validate({ data: { test: 1 }, source })
      expect(error).toBeUndefined()
    })
  })

  it('defaults source to manual', () => {
    const { value } = submitProspectSchema.validate({ data: { test: 1 } })
    expect(value.source).toBe('manual')
  })

  it('reject schema requires notas', () => {
    const { error } = rejectProspectSchema.validate({})
    expect(error).toBeDefined()
  })

  it('reject schema accepts notas', () => {
    const { error } = rejectProspectSchema.validate({ notas: 'No relevante' })
    expect(error).toBeUndefined()
  })
})

// ═══════════════════════════════════════════
// Green Roof Schema
// ═══════════════════════════════════════════
describe('Validation Schemas — Green Roof', () => {
  const validRoof = {
    nombre: 'Techo Verde Test',
    alcaldia: 'Coyoacán',
    tipoEdificio: 'hospital',
    tipoTechoVerde: 'extensivo',
    superficie: 500,
    lat: 19.35,
    lng: -99.16,
  }

  it('accepts valid green roof', () => {
    const { error } = greenRoofSchema.validate(validRoof)
    expect(error).toBeUndefined()
  })

  it('rejects missing nombre', () => {
    const { error } = greenRoofSchema.validate({ ...validRoof, nombre: undefined })
    expect(error).toBeDefined()
  })

  it('accepts all valid tipoTechoVerde', () => {
    ['extensivo', 'intensivo', 'semi-intensivo'].forEach(tipo => {
      const { error } = greenRoofSchema.validate({ ...validRoof, tipoTechoVerde: tipo })
      expect(error).toBeUndefined()
    })
  })

  it('rejects invalid tipoTechoVerde', () => {
    const { error } = greenRoofSchema.validate({ ...validRoof, tipoTechoVerde: 'invalid' })
    expect(error).toBeDefined()
  })

  it('defaults estado to nuevo', () => {
    const { value } = greenRoofSchema.validate(validRoof)
    expect(value.estado).toBe('nuevo')
  })

  it('defaults visible to true', () => {
    const { value } = greenRoofSchema.validate(validRoof)
    expect(value.visible).toBe(true)
  })

  it('defaults archivado to false', () => {
    const { value } = greenRoofSchema.validate(validRoof)
    expect(value.archivado).toBe(false)
  })

  it('accepts visible=false', () => {
    const { error, value } = greenRoofSchema.validate({ ...validRoof, visible: false })
    expect(error).toBeUndefined()
    expect(value.visible).toBe(false)
  })
})

// ═══════════════════════════════════════════
// Candidate Roof Schema
// ═══════════════════════════════════════════
describe('Validation Schemas — Candidate Roof', () => {
  const validCandidate = {
    nombre: 'Candidato Test',
    alcaldia: 'Miguel Hidalgo',
    tipoEdificio: 'oficinas',
    superficie: 800,
    scoreAptitud: 75,
    lat: 19.43,
    lng: -99.19,
  }

  it('accepts valid candidate', () => {
    const { error } = candidateRoofSchema.validate(validCandidate)
    expect(error).toBeUndefined()
  })

  it('rejects score out of range', () => {
    const { error } = candidateRoofSchema.validate({ ...validCandidate, scoreAptitud: 150 })
    expect(error).toBeDefined()
  })

  it('accepts all valid estatus', () => {
    ['candidato', 'validado_visualmente', 'factibilidad_pendiente', 'piloto', 'implementado'].forEach(estatus => {
      const { error } = candidateRoofSchema.validate({ ...validCandidate, estatus })
      expect(error).toBeUndefined()
    })
  })

  it('defaults visible to true and archivado to false', () => {
    const { value } = candidateRoofSchema.validate(validCandidate)
    expect(value.visible).toBe(true)
    expect(value.archivado).toBe(false)
  })
})

// ═══════════════════════════════════════════
// Validation Record Schema
// ═══════════════════════════════════════════
describe('Validation Schemas — Validation Record', () => {
  const validRecord = {
    nombre: 'Hospital General',
  }

  it('accepts valid record', () => {
    const { error } = validationRecordSchema.validate(validRecord)
    expect(error).toBeUndefined()
  })

  it('rejects missing nombre', () => {
    const { error } = validationRecordSchema.validate({})
    expect(error).toBeDefined()
  })

  it('accepts all valid estado values', () => {
    ['pendiente', 'confirmado', 'rechazado', 'indeterminado', 'pendiente_reconciliacion'].forEach(estado => {
      const { error } = validationRecordSchema.validate({ ...validRecord, estado })
      expect(error).toBeUndefined()
    })
  })

  it('accepts all valid confianza values', () => {
    ['alta', 'media', 'baja'].forEach(confianza => {
      const { error } = validationRecordSchema.validate({ ...validRecord, confianza })
      expect(error).toBeUndefined()
    })
  })

  it('defaults visible to true and archivado to false', () => {
    const { value } = validationRecordSchema.validate(validRecord)
    expect(value.visible).toBe(true)
    expect(value.archivado).toBe(false)
  })

  it('defaults estado to pendiente', () => {
    const { value } = validationRecordSchema.validate(validRecord)
    expect(value.estado).toBe('pendiente')
  })
})
