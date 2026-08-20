// Maps de códigos → labels legibles. Módulo PURO: sin JSX, sin lucide,
// sin dependencias — importable desde node (validación build-time) y tests.
// Los iconos de accesibilidad viven en labels.js (capa UI, D17).

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
  'neuropediatria': 'Neuropediatría',
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
  'unknown': 'A confirmar',
}

export const PROCEDURE_CATEGORY_LABELS = {
  'salud': 'Salud',
  'educacion': 'Educación',
  'otros': 'Otros',
  'transporte': 'Transporte',
}

// Sin iconos acá: solo key + label (label-maps debe ser importable en node).
export const ACCESSIBILITY_META = [
  { key: 'wheelchair_ramp', label: 'Rampa para silla de ruedas' },
  { key: 'adapted_bathroom', label: 'Baño adaptado' },
  { key: 'elevator', label: 'Ascensor' },
  { key: 'signage_simplified', label: 'Señalética simplificada' },
]

const label = (map, code) => map[code] ?? code

export const typeLabel = (code) => label(TYPE_LABELS, code)
export const specialtyLabel = (code) => label(SPECIALTY_LABELS, code)
export const categoryLabel = (code) => label(PROCEDURE_CATEGORY_LABELS, code)