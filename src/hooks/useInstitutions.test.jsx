import { renderHook, waitFor } from '@testing-library/react'
import useInstitutions from './useInstitutions'

// D19: local-first — la data local es la fuente inmediata (status 'success'
// desde el montaje, sin pantalla de carga); el remoto se carga en background
// y hace swap silencioso; si el remoto falla se mantiene la local (isLocal
// true) con error seteado para el banner amber; abort en cleanup.

const LOCAL_COUNT = 5 // instituciones reales en src/data/institutions.json

const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

// Remoto con shapes incompletos que el normalizer debe completar (D16)
const REMOTE_RAW = [
  {
    id: 'r1',
    name: 'Remota',
    address: { street: 'Calle 1', city: 'San Pedro' },
    coverage: {},
    age_range: { min: null, max: null },
    contact: { phone: '123' },
    specialties: ['neurologia'],
    type: 'salud',
    verification: { status: 'verified' },
    accessibility: {},
  },
]

describe('useInstitutions — local-first (D19)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('monta con data local inmediata y status success (sin pantalla de carga)', () => {
    // El remoto nunca responde: igual la local está disponible ya
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise(() => {})))
    const { result } = renderHook(() => useInstitutions())

    expect(result.current.status).toBe('success')
    expect(result.current.institutions).toHaveLength(LOCAL_COUNT)
  })

  it('si el remoto falla: mantiene la local, isLocal true y error seteado', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    const { result } = renderHook(() => useInstitutions())

    await waitFor(() => expect(result.current.error).not.toBeNull())
    // Sin pantalla de error: la demo sigue con la data local
    expect(result.current.status).toBe('success')
    expect(result.current.isLocal).toBe(true)
    expect(result.current.institutions).toHaveLength(LOCAL_COUNT)
  })

  it('si el remoto responde: swap silencioso con data NORMALIZADA', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(REMOTE_RAW)))
    const { result } = renderHook(() => useInstitutions())

    await waitFor(() => expect(result.current.institutions).toHaveLength(1))
    expect(result.current.isLocal).toBe(false)
    expect(result.current.error).toBeNull()

    const inst = result.current.institutions[0]
    expect(inst.coverage).toEqual({}) // D16: objeto siempre
    expect(inst.age_range).toBeNull() // vacío → null
    expect(inst.contact).toEqual({ phone: '123' })
    expect(inst.verification).toEqual({ status: 'verified' })
  })

  it('aborta la request al desmontar (cleanup)', () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise(() => {})))
    const abortSpy = vi.spyOn(AbortController.prototype, 'abort')

    const { unmount } = renderHook(() => useInstitutions())
    unmount()

    expect(abortSpy).toHaveBeenCalled()
  })
})