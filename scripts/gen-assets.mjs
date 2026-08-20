#!/usr/bin/env node
// Genera los PNG estáticos del sitio (favicon y logo) desde SVG embebidos,
// usando sharp. Si sharp no está instalado, falla con un mensaje claro:
//
//   npm i -D sharp
//   npm run gen:assets

import { mkdir, writeFile } from 'node:fs/promises'
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

const PUBLIC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public')

// SVG embebidos (cero dependencias de archivos fuente)
const ASSETS = [
  {
    name: 'favicon-32.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="8" fill="#0d9488"/>
  <text x="16" y="22" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="700" fill="#ffffff" text-anchor="middle">SP</text>
</svg>`,
  },
  {
    name: 'logo-header.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="64" viewBox="0 0 240 64">
  <rect width="240" height="64" rx="14" fill="#0d9488"/>
  <text x="120" y="40" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="#ffffff" text-anchor="middle">Incluyendo SP</text>
</svg>`,
  },
]

await mkdir(PUBLIC_DIR, { recursive: true })

for (const { name, svg } of ASSETS) {
  const buffer = await sharp(Buffer.from(svg)).png().toBuffer()
  const target = path.join(PUBLIC_DIR, name)
  await writeFile(target, buffer)
  console.log(`gen-assets: ${name} (${buffer.length} bytes)`)
}