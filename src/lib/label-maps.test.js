import institutionsData from '../data/institutions.json'
import proceduresData from '../data/procedures.json'
import {
  ACCESSIBILITY_META,
  CUD_LABELS,
  PROCEDURE_CATEGORY_LABELS,
  SPECIALTY_LABELS,
  STATUS_LABELS,
  TYPE_LABELS,
  categoryLabel,
  specialtyLabel,
  typeLabel,
} from './label-maps'

// label-maps.js es la ÚNICA fuente de labels (BR-DV-1): todo código
// presente en los JSON de data DEBE tener label. El drift inverso
// (label sin código en data) es warning, no rompe (BR-DV-2).

describe('label-maps — cobertura de códigos reales', () => {
  it('todo código de institutions.json tiene label', () => {
    const { institutions } = institutionsData

    const specialties = new Set()
    const types = new Set()
    const cuds = new Set()
    const statuses = new Set()
    institutions.forEach((institution) => {
      institution.specialties.forEach((code) => specialties.add(code))
      types.add(institution.type)
      cuds.add(institution.coverage?.cud)
      statuses.add(institution.verification?.status)
    })

    for (const code of specialties) {
      expect(SPECIALTY_LABELS[code], `especialidad sin label: ${code}`).toBeTruthy()
    }
    for (const code of types) {
      expect(TYPE_LABELS[code], `tipo sin label: ${code}`).toBeTruthy()
    }
    for (const code of cuds) {
      expect(CUD_LABELS[code], `cud sin label: ${code}`).toBeTruthy()
    }
    for (const code of statuses) {
      expect(STATUS_LABELS[code], `status sin label: ${code}`).toBeTruthy()
    }
  })

  it('todo código de procedures.json tiene label', () => {
    const { procedures } = proceduresData
    const categories = new Set(procedures.map((procedure) => procedure.category))
    expect(categories.size).toBeGreaterThan(0)
    for (const code of categories) {
      expect(PROCEDURE_CATEGORY_LABELS[code], `categoría sin label: ${code}`).toBeTruthy()
    }
  })

  it('neuropediatria y transporte tienen labels legibles', () => {
    expect(SPECIALTY_LABELS.neuropediatria).toBe('Neuropediatría')
    expect(PROCEDURE_CATEGORY_LABELS.transporte).toBe('Transporte')
    expect(specialtyLabel('neuropediatria')).toBe('Neuropediatría')
    expect(categoryLabel('transporte')).toBe('Transporte')
  })

  it('STATUS unknown tiene label "A confirmar" (D18)', () => {
    expect(STATUS_LABELS.unknown).toBe('A confirmar')
  })

  it('ACCESSIBILITY_META es puro: {key, label} sin iconos (D17)', () => {
    expect(ACCESSIBILITY_META.length).toBeGreaterThan(0)
    for (const item of ACCESSIBILITY_META) {
      expect(typeof item.key).toBe('string')
      expect(typeof item.label).toBe('string')
      expect(item.icon).toBeUndefined()
    }
  })

  it('drift inverso no rompe: código sin label muestra el código crudo', () => {
    expect(typeLabel('codigo-inexistente')).toBe('codigo-inexistente')
    expect(specialtyLabel('codigo-inexistente')).toBe('codigo-inexistente')
    expect(categoryLabel('codigo-inexistente')).toBe('codigo-inexistente')
  })
})