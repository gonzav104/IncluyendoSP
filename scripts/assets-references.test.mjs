import { readFile } from 'node:fs/promises'
import path from 'node:path'

// T-25: el sitio referencia los assets generados por gen:assets:
// index.html → link icon /favicon-32.png; App.jsx → img /logo-header.png.

const ROOT = process.cwd()

const indexHtml = await readFile(path.join(ROOT, 'index.html'), 'utf8')
const appJsx = await readFile(path.join(ROOT, 'src', 'App.jsx'), 'utf8')

describe('assets-references (T-25)', () => {
  it('index.html usa /favicon-32.png como ícono del sitio', () => {
    expect(indexHtml).toMatch(/rel="icon"[^>]*href="\/favicon-32\.png"/)
    expect(indexHtml).not.toMatch(/logo_incluyendosp\.png/)
  })

  it('App.jsx usa /logo-header.png como logo del encabezado', () => {
    expect(appJsx).toMatch(/src="\/logo-header\.png"/)
    expect(appJsx).not.toMatch(/logo_incluyendosp\.png/)
  })
})