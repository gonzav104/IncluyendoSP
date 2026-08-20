import { ApiError, API_ENDPOINTS, BASE_URL, request } from './api'

// FR-AC-1/FR-AC-2: request() combina timeout 15s + signal externo, parsing
// defensivo (HTML → ApiError kind 'parse', NUNCA SyntaxError) y ApiError
// normalizado { status, message, kind, cause } (D15).

const jsonResponse = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const htmlResponse = (status) =>
  new Response('<html><body>502 Bad Gateway</body></html>', {
    status,
    headers: { 'Content-Type': 'text/html' },
  })

// Fetch mock que nunca resuelve pero rechaza con AbortError al abortar la señal
const hangingFetch = () =>
  vi.fn((_url, options) => {
    const { signal } = options ?? {}
    return new Promise((_resolve, reject) => {
      signal?.addEventListener('abort', () => {
        reject(new DOMException('The operation was aborted', 'AbortError'))
      })
    })
  })

describe('request() — api client', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('devuelve JSON parseado cuando el servidor responde ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, { ok: true })))
    await expect(request('/api/x')).resolves.toEqual({ ok: true })
  })

  it('HTML de render → ApiError kind parse con mensaje claro (nunca SyntaxError)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(htmlResponse(502)))
    const err = await request('/api/x').catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.kind).toBe('parse')
    expect(err.message).toMatch(/respuesta inesperada/i)
    expect(err).not.toBeInstanceOf(SyntaxError)
  })

  it('error HTTP con JSON → ApiError { status, message, kind http }', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(500, { error: 'boom interno' })))
    const err = await request('/api/x').catch((e) => e)
    expect(err).toMatchObject({ status: 500, message: 'boom interno', kind: 'http' })
  })

  it('error HTTP con JSON inválido → mensaje default con el estado', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('{esto no es json', {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )
    const err = await request('/api/x').catch((e) => e)
    expect(err).toMatchObject({ status: 404, kind: 'http' })
    expect(err.message).toMatch(/404/)
  })

  it('timeout → ApiError kind timeout (fake timers + advance manual)', async () => {
    vi.useFakeTimers()
    // AbortSignal.timeout usa timers de plataforma: lo simulamos con un
    // setTimeout parcheable y avanzamos manualmente 15000ms (gotcha a).
    const timeoutSpy = vi
      .spyOn(AbortSignal, 'timeout')
      .mockImplementation((ms) => {
        const controller = new AbortController()
        setTimeout(
          () => controller.abort(new DOMException('The operation timed out', 'TimeoutError')),
          ms,
        )
        return controller.signal
      })

    vi.stubGlobal('fetch', hangingFetch())
    const promise = request('/api/slow')
    // Adjuntamos el handler ANTES de avanzar: el abort dispara el rechazo
    // durante el advance y un handler tardío genera unhandled rejection.
    let captured
    const settled = promise.catch((e) => {
      captured = e
    })

    await vi.advanceTimersByTimeAsync(15000)
    await settled
    expect(timeoutSpy).toHaveBeenCalledWith(15000)
    expect(captured).toBeInstanceOf(ApiError)
    expect(captured.kind).toBe('timeout')
    expect(captured.message).toMatch(/tardó demasiado/i)
  })

  it('abort externo → ApiError kind aborted', async () => {
    const external = new AbortController()
    vi.stubGlobal('fetch', hangingFetch())
    const promise = request('/api/slow', { signal: external.signal })
    let captured
    const settled = promise.catch((e) => {
      captured = e
    })
    external.abort()
    await settled
    expect(captured).toBeInstanceOf(ApiError)
    expect(captured.kind).toBe('aborted')
    expect(captured.message).toMatch(/cancelada/i)
  })

  it('POST envía headers JSON y body serializado a BASE_URL + endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    await request(API_ENDPOINTS.assistant, { method: 'POST', body: { prompt: 'hola' } })

    expect(BASE_URL).toBe('http://localhost:3000')
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}${API_ENDPOINTS.assistant}`,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'hola' }),
      }),
    )
  })
})