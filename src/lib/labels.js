import {
  Accessibility,
  ArrowUpDown,
  Bath,
  Type,
} from 'lucide-react'
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

// Capa UI sobre los maps puros de label-maps.js (única fuente de truth):
// acá se acoplan los iconos de lucide y los helpers de formato que usan
// los componentes. Re-exporta los maps para no romper los imports
// existentes (App, InstitutionModal, ProcedureFolder, InstitutionCard).

export {
  ACCESSIBILITY_META,
  CUD_LABELS,
  PROCEDURE_CATEGORY_LABELS,
  SPECIALTY_LABELS,
  STATUS_LABELS,
  TYPE_LABELS,
  categoryLabel,
  specialtyLabel,
  typeLabel,
}

const ICONS_BY_KEY = {
  wheelchair_ramp: Accessibility,
  adapted_bathroom: Bath,
  elevator: ArrowUpDown,
  signage_simplified: Type,
}

export const ACCESSIBILITY_ITEMS = ACCESSIBILITY_META.map((item) => ({
  ...item,
  icon: ICONS_BY_KEY[item.key] ?? Accessibility,
}))

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