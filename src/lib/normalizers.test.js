import { normalizeInstitution } from './normalizers'

// BR-DN-2: defaults explícitos para campos ausentes. D16: address/contact
// son OBJETOS (el código real los trata como objetos), no strings.
// La función NUNCA muta el input (objeto nuevo + copias por campo).

describe('normalizeInstitution — defaults del contrato', () => {
  it('objeto incompleto → contrato completo con defaults', () => {
    const result = normalizeInstitution({ name: 'Escuela Nº 1' })

    expect(result.name).toBe('Escuela Nº 1')
    expect(result.type).toBe('desconocido')
    expect(result.specialties).toEqual([])
    expect(result.age_range).toBeNull()
    expect(result.address).toEqual({})
    expect(result.contact).toEqual({})
    expect(result.coverage).toEqual({})
    expect(result.accessibility).toEqual({})
    expect(result.services).toEqual([])
    expect(result.verification).toEqual({ status: 'unknown' })
  })

  it('campos presentes se preservan sin mutar el input', () => {
    const raw = {
      id: 'i-1',
      name: 'Hospital San Pedro',
      type: 'hospital',
      specialties: ['pediatria', 'neuropediatria'],
      age_range: { min: 0, max: 12 },
      address: { street: 'Av. Mitre 100', city: 'San Pedro' },
      contact: { phone: '3329-400000' },
      coverage: { cud: 'yes', accepted_plans: [] },
      accessibility: { wheelchair_ramp: true },
      services: ['internacion'],
      verification: { status: 'verified', verified_at: '2026-01-01' },
    }
    const snapshot = JSON.parse(JSON.stringify(raw))
    const specialtiesRef = raw.specialties
    const addressRef = raw.address

    const result = normalizeInstitution(raw)

    expect(result).toEqual(raw)
    // No muta el input: contenido intacto y referencias internas sin tocar
    expect(raw).toEqual(snapshot)
    expect(raw.specialties).toBe(specialtiesRef)
    expect(raw.address).toBe(addressRef)
  })

  it('null en campos obligatorios → defaults (no crash)', () => {
    const result = normalizeInstitution({ name: null, type: null, specialties: null })

    expect(result.name).toBe('')
    expect(result.type).toBe('desconocido')
    expect(result.specialties).toEqual([])
    expect(result.verification).toEqual({ status: 'unknown' })
  })

  it('age_range inválido (sin min ni max) → null', () => {
    expect(normalizeInstitution({ age_range: {} }).age_range).toBeNull()
    expect(normalizeInstitution({ age_range: null }).age_range).toBeNull()
  })

  it('verification sin status → { status: "unknown" } pero preserva el resto', () => {
    const result = normalizeInstitution({ verification: { source: 'Municipio' } })
    expect(result.verification).toEqual({ status: 'unknown', source: 'Municipio' })
  })
})