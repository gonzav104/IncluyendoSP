import { act, renderHook, waitFor } from '@testing-library/react'
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

  it('monta con data local inmediata y status loading durante el fetch background (D19)', () => {
    // El remoto nunca responde: la local está disponible ya y el fetch
    // background queda en vuelo → status 'loading' (spinner del Reintentar).
    // La pantalla de carga de App exige institutions.length === 0, así que
    // con data local presente nunca aparece (directorio < 100ms).
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise(() => {})))
    const { result } = renderHook(() => useInstitutions())

    expect(result.current.institutions).toHaveLength(LOCAL_COUNT)
    expect(result.current.status).toBe('loading')
  })

  it('load(): status loading durante la recarga y success al resolver (D19)', async () => {
    const fetches = []
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise((resolve) => fetches.push(resolve))),
    )
    const { result } = renderHook(() => useInstitutions())

    // fetch 0 = background del mount; fetch 1 = reintento manual
    await waitFor(() => expect(fetches).toHaveLength(1))

    act(() => {
      result.current.load()
    })
    // D19: durante el reintento el botón queda con spinner (status loading)
    expect(result.current.status).toBe('loading')

    fetches[1](jsonResponse(REMOTE_RAW))
    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.institutions).toHaveLength(1)
    expect(result.current.isLocal).toBe(false)
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