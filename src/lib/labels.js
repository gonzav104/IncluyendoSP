import {
  Accessibility,
  ArrowUpDown,
  Bath,
  Type,
} from 'lucide-react'

// Traducción de códigos del JSON a etiquetas legibles + helpers de formato.
// El JSON guarda códigos slug ("escuela-primaria", "tea") para filtrar;
// acá se convierten a lo que ve la familia.

export const TYPE_LABELS = {
  'escuela-primaria': 'Escuela primaria',
  'jardin-infantes': 'Jardín de infantes',
  'centro-educativo-terapeutico': 'Centro educativo terapéutico',
  'centro-dia': 'Centro de día',
  'salita': 'Salita / Centro de salud',
  'hospital': 'Hospital',
  'consultorio-privado': 'Consultorio privado',
  'profesional-independiente': 'Profesional independiente',
  'asociacion': 'Asociación',
  'organismo-publico': 'Organismo público',
}

export const SPECIALTY_LABELS = {
  'tea': 'TEA',
  'discapacidad-motriz': 'Discapacidad motriz',
  'estimulacion-temprana': 'Estimulación temprana',
  'fonoaudiologia': 'Fonoaudiología',
  'psicopedagogia': 'Psicopedagogía',
  'terapia-ocupacional': 'Terapia ocupacional',
  'kinesiologia': 'Kinesiología',
  'psicologia': 'Psicología',
  'educacion-especial': 'Educación especial',
  'integracion-escolar': 'Integración escolar',
  'neurologia': 'Neurología',
  'pediatria': 'Pediatría',
}

export const CUD_LABELS = {
  'yes': 'Acepta CUD',
  'no': 'No acepta CUD',
  'unknown': 'CUD a confirmar',
}

export const STATUS_LABELS = {
  'verified': 'Verificado',
  'pending': 'Pendiente de verificación',
  'outdated': 'Dato desactualizado',
}

export const PROCEDURE_CATEGORY_LABELS = {
  'salud': 'Salud',
  'educacion': 'Educación',
  'otros': 'Otros',
}

export const ACCESSIBILITY_ITEMS = [
  { key: 'wheelchair_ramp', label: 'Rampa para silla de ruedas', icon: Accessibility },
  { key: 'adapted_bathroom', label: 'Baño adaptado', icon: Bath },
  { key: 'elevator', label: 'Ascensor', icon: ArrowUpDown },
  { key: 'signage_simplified', label: 'Señalética simplificada', icon: Type },
]

const label = (map, code) => map[code] ?? code

export const typeLabel = (code) => label(TYPE_LABELS, code)
export const specialtyLabel = (code) => label(SPECIALTY_LABELS, code)
export const categoryLabel = (code) => label(PROCEDURE_CATEGORY_LABELS, code)

export function isVerified(institution) {
  return institution?.verification?.status === 'verified'
}

export function formatAgeRange(ageRange) {
  if (!ageRange || (ageRange.min == null && ageRange.max == null)) return 'Sin especificar'
  if (ageRange.min == null) return `Hasta ${ageRange.max} años`
  if (ageRange.max == null) return `Desde ${ageRange.min} años`
  return `${ageRange.min} a ${ageRange.max} años`
}

// accepted_plans: [] = no aplica · ["Desconocido"] = aún sin dato verificado
export function formatPlans(plans) {
  if (!plans || plans.length === 0) return 'No aplica'
  return plans.map((plan) => (plan === 'Desconocido' ? 'A confirmar' : plan)).join(', ')
}
