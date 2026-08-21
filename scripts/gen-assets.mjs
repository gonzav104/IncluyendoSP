#!/usr/bin/env node
// Genera los PNG estáticos del sitio (favicon y header) DESDE el logo
// original, usando sharp. Si sharp no está instalado, falla con un mensaje
// claro:
//
//   npm i -D sharp
//   npm run gen:assets
//
// Fuente: assets-src/logo_incluyendosp.png (el logo real; BR-AS-1: cero
// assets inventados). El original vive FUERA de public/ para que Vite no lo
// copie a dist (398KB de peso muerto): solo los derivados se deployan.

import { statSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

let sharp
try {
  sharp = (await import('sharp')).default
} catch {
  // Ruta compartida con GEN_ASSETS_SKIP_SHARP (usada por los tests para
  // forzar el camino de error de forma determinística).
  console.error('Falta la dependencia "sharp" para generar los assets.')
  console.error('Instalala con: npm i -D sharp')
  process.exit(1)
}

if (process.env.GEN_ASSETS_SKIP_SHARP === '1') {
  console.error('Falta la dependencia "sharp" para generar los assets.')
  console.error('Instalala con: npm i -D sharp')
  process.exit(1)
}

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = path.join(ROOT, 'assets-src', 'logo_incluyendosp.png')
const PUBLIC_DIR = path.join(ROOT, 'public')

// Límites (BR-AS-1): no commiteamos un asset que excede lo razonable
const LIMITS = { 'favicon-32.png': 10 * 1024, 'logo-header.png': 60 * 1024 }

const SOURCE_ASSETS = [
  {
    name: 'favicon-32.png',
    pipeline: () =>
      sharp(SOURCE).resize(32, 32, { fit: 'cover' }).png({ compressionLevel: 9, palette: true }),
  },
  {
    name: 'logo-header.png',
    pipeline: () => sharp(SOURCE).resize({ height: 96 }).png({ compressionLevel: 9 }),
  },
]

if (!statSync(SOURCE, { throwIfNoEntry: false })) {
  console.error(`gen-assets: no existe el logo original (${SOURCE}).`)
  console.error('Restaurá assets-src/logo_incluyendosp.png y volvé a correr el script.')
  process.exit(1)
}

await mkdir(PUBLIC_DIR, { recursive: true })

for (const { name, pipeline } of SOURCE_ASSETS) {
  const buffer = await pipeline().toBuffer()
  const limit = LIMITS[name]
  if (buffer.length > limit) {
    console.error(
      `gen-assets: ${name} pesa ${buffer.length} bytes (> ${limit}) — no se commitea un asset inválido (BR-AS-1).`,
    )
    process.exit(1)
  }
  const { writeFile } = await import('node:fs/promises')
  await writeFile(path.join(PUBLIC_DIR, name), buffer)
  console.log(`gen-assets: ${name} (${buffer.length} bytes)`)
}