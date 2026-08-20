// Validación build-time de labels (BR-DV-2/BR-DV-3): todo código presente
// en src/data/*.json DEBE tener label en label-maps.js. El drift inverso
// (label sin código en data) es warning, no bloquea.
//
// Uso:
//   node scripts/validate-data.mjs            → valida data real (prebuild)
//   node scripts/validate-data.mjs <archivo>  → valida un archivo específico
//
// Exit != 0 si hay códigos huérfanos → rompe el build de Vercel.

import { readFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import {
  CUD_LABELS,
  PROCEDURE_CATEGORY_LABELS,
  SPECIALTY_LABELS,
  STATUS_LABELS,
  TYPE_LABELS,
} from '../src/lib/label-maps.js'

const DATA_DIR = resolve(process.cwd(), 'src', 'data')
const DEFAULT_FILES = ['institutions.json', 'procedures.json']

const LABEL_MAPS = {
  specialty: SPECIALTY_LABELS,
  type: TYPE_LABELS,
  cud: CUD_LABELS,
  status: STATUS_LABELS,
  category: PROCEDURE_CATEGORY_LABELS,
}

/** Recorre los códigos de un archivo y devuelve [{ archivo, item, campo, codigo }] */
const collectCodes = (filePath) => {
  const raw = JSON.parse(readFileSync(filePath, 'utf8'))
  const fileName = filePath.split(/[\\/]/).pop()
  const orphans = []
  const usedCodes = { specialty: new Set(), type: new Set(), cud: new Set(), status: new Set(), category: new Set() }

  if (Array.isArray(raw.institutions)) {
    for (const institution of raw.institutions) {
      for (const specialty of institution.specialties ?? []) {
        usedCodes.specialty.add(specialty)
        if (!LABEL_MAPS.specialty[specialty]) {
          orphans.push({ archivo: fileName, item: institution.name ?? institution.id ?? '?', campo: 'specialties', codigo: specialty })
        }
      }
      for (const [campo, mapKey] of [['type', 'type'], ['cud', 'cud'], ['status', 'status']]) {
        const code = campo === 'type' ? institution.type : campo === 'cud' ? institution.coverage?.cud : institution.verification?.status
        if (code == null) continue
        usedCodes[mapKey].add(code)
        if (!LABEL_MAPS[mapKey][code]) {
          orphans.push({ archivo: fileName, item: institution.name ?? institution.id ?? '?', campo, codigo: code })
        }
      }
    }
  }

  if (Array.isArray(raw.procedures)) {
    for (const procedure of raw.procedures) {
      const code = procedure.category
      if (code == null) continue
      usedCodes.category.add(code)
      if (!LABEL_MAPS.category[code]) {
        orphans.push({ archivo: fileName, item: procedure.title ?? procedure.id ?? '?', campo: 'category', codigo: code })
      }
    }
  }

  return { orphans, usedCodes }
}

/** Drift inverso: labels que ningún código de data usa → warning, no bloquea */
const collectReverseDrift = (usedCodes) => {
  const unused = []
  for (const [mapKey, codes] of Object.entries(usedCodes)) {
    for (const labelCode of Object.keys(LABEL_MAPS[mapKey])) {
      if (!codes.has(labelCode)) unused.push(`${mapKey}:${labelCode}`)
    }
  }
  return unused
}

const main = () => {
  // Sin args → data real en src/data/; con args → paths explícitos (fixtures en tests)
  const targets =
    process.argv.slice(2).length > 0
      ? process.argv.slice(2).map((target) => resolve(target))
      : DEFAULT_FILES.map((file) => join(DATA_DIR, file))

  let totalOrphans = 0
  let totalUsed = 0
  const allUsed = { specialty: new Set(), type: new Set(), cud: new Set(), status: new Set(), category: new Set() }

  for (const target of targets) {
    const filePath = resolve(target)
    if (!existsSync(filePath)) {
      console.error(`[validate-data] Archivo no encontrado: ${filePath}`)
      process.exit(1)
    }

    const { orphans, usedCodes } = collectCodes(filePath)
    for (const [key, codes] of Object.entries(usedCodes)) {
      for (const code of codes) allUsed[key].add(code)
    }
    totalOrphans += orphans.length

    for (const orphan of orphans) {
      console.error(
        `[validate-data] DRIFT: "${orphan.codigo}" (${orphan.campo}) en ${orphan.archivo} (${orphan.item}) no tiene label en label-maps.js`,
      )
    }
  }

  const reverseDrift = collectReverseDrift(allUsed)
  for (const unused of reverseDrift) {
    console.warn(`[validate-data] warning: label sin uso en data (${unused})`)
  }

  const labelCount = Object.values(LABEL_MAPS).reduce((acc, map) => acc + Object.keys(map).length, 0)
  totalUsed = Object.values(allUsed).reduce((acc, codes) => acc + codes.size, 0)

  if (totalOrphans > 0) {
    console.error(`[validate-data] ${totalOrphans} código(s) sin label. Agregá el label en src/lib/label-maps.js.`)
    process.exit(1)
  }

  const fileNames = targets.map((filePath) => filePath.split(/[\\/]/).pop()).join(', ')
  console.log(
    `[validate-data] OK (${fileNames}): ${labelCount} labels vs ${totalUsed} códigos en uso.`,
  )
}

main()