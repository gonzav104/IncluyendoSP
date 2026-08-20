// Normalización de instituciones — misma función para data remota (BFF)
// y local (JSON): mismo shape → mismo contrato (BR-DN-1).
// NUNCA muta el input: devuelve un objeto nuevo con copias por campo.

const asString = (value) => (typeof value === 'string' ? value : '')

const asArray = (value) => (Array.isArray(value) ? value : [])

const asObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? { ...value } : {}

// age_range válido = objeto con min o max definidos; {} o null → null
const asAgeRange = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  if (value.min == null && value.max == null) return null
  return { ...value }
}

const asVerification = (value) => {
  const base = asObject(value)
  return { status: 'unknown', ...base }
}

export function normalizeInstitution(raw) {
  const source = raw && typeof raw === 'object' ? raw : {}

  return {
    id: asString(source.id),
    name: asString(source.name),
    type: asString(source.type) || 'desconocido',
    specialties: asArray(source.specialties),
    age_range: asAgeRange(source.age_range),
    address: asObject(source.address),
    contact: asObject(source.contact),
    coverage: asObject(source.coverage),
    accessibility: asObject(source.accessibility),
    services: asArray(source.services),
    verification: asVerification(source.verification),
  }
}