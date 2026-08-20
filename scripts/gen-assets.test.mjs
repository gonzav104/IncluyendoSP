import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

// T-22: gen-assets.mjs falla con exit code 1 y mensaje claro si sharp no está
// disponible (dependencia de generación de PNG). El test fuerza el camino de
// error con GEN_ASSETS_SKIP_SHARP para ser determinístico (tras T-23, sharp
// está instalado y el guard real no se puede disparar).

const run = promisify(execFile)

describe('gen-assets.mjs — guard de sharp (T-22)', () => {
  it('sin sharp disponible: exit code 1 y mensaje de instalación', async () => {
    const err = await run(process.execPath, ['scripts/gen-assets.mjs'], {
      env: { ...process.env, GEN_ASSETS_SKIP_SHARP: '1' },
    }).catch((e) => e)

    expect(err).toBeInstanceOf(Error)
    expect(err.code).toBe(1)
    expect(err.stderr).toContain('sharp')
  })
})