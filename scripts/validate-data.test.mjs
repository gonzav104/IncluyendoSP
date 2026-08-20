import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Valida el script build-time (BR-DV-2/BR-DV-3): data real → exit 0 con
// counts; un código huérfano (sin label) → exit 1 listándolo.

// Vitest corre desde la raíz del proyecto; jsdom hace que import.meta.url
// no sea scheme file, así que resolvemos contra process.cwd().
const SCRIPT = join(process.cwd(), 'scripts', 'validate-data.mjs')

const runScript = (extraArgs = []) =>
  execFileSync('node', [SCRIPT, ...extraArgs], { encoding: 'utf8', stdio: 'pipe' })

const withFixture = (payload) => {
  const dir = mkdtempSync(join(tmpdir(), 'incluyendosp-validate-'))
  const file = join(dir, 'institutions.json')
  writeFileSync(file, JSON.stringify(payload))
  return { dir, file }
}

describe('validate-data.mjs — validación build-time', () => {
  it('data real → exit 0 con counts de labels vs códigos', () => {
    const stdout = runScript()
    expect(stdout).toMatch(/institutions/i)
    expect(stdout).toMatch(/\d+ labels? vs \d+ códigos?/i)
  })

  it('código huérfano en data → exit 1 listándolo', () => {
    const { dir, file } = withFixture({
      institutions: [
        {
          id: 'x-1',
          name: 'Institucion X',
          type: 'hospital',
          specialties: ['codigo-huerfano'],
          coverage: { cud: 'yes' },
          verification: { status: 'verified' },
        },
      ],
    })
    try {
      let error = null
      try {
        runScript([file])
      } catch (err) {
        error = err
      }
      expect(error).not.toBeNull()
      expect(error.status).toBe(1)
      // El drift se lista por stderr (console.error); capturamos ambos streams
      expect(`${error.stdout ?? ''}${error.stderr ?? ''}`).toMatch(/codigo-huerfano/)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('fixture con códigos válidos → exit 0 (triangulación)', () => {
    const { dir, file } = withFixture({
      institutions: [
        {
          id: 'x-2',
          name: 'Institucion Y',
          type: 'hospital',
          specialties: ['pediatria', 'neuropediatria'],
          coverage: { cud: 'yes' },
          verification: { status: 'unknown' },
        },
      ],
    })
    try {
      const stdout = runScript([file])
      expect(stdout).toMatch(/OK|válid|pass/i)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})