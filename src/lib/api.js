// Cliente API — ÚNICO punto de fetch de la app (BR-AC-1).
// Toda request tiene timeout de 15s y es cancelable (BR-AC-2);
// las respuestas no-JSON se transforman en ApiError legible, nunca
// SyntaxError crudo (BR-AC-3).

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const API_ENDPOINTS = {
  institutions: '/api/institutions',
  assistant: '/api/assistant',
  suggestions: '/api/suggestions',
}

export const REQUEST_TIMEOUT_MS = 15000

export class ApiError extends Error {
  constructor(status, message, kind = 'http', cause) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.kind = kind // 'http' | 'timeout' | 'aborted' | 'parse' | 'network' (D15)
    if (cause !== undefined) this.cause = cause
  }
}

const isJsonContentType = (res) => (res.headers.get('content-type') ?? '').includes('application/json')

// Combinación de señales: timeout fijo + signal externo (cancelación en
// unmount). Fallback manual si AbortSignal.any no está disponible.
const combineSignals = (signal) => {
  const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  if (!signal) return timeoutSignal
  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any([timeoutSignal, signal])
  }
  // Fallback anotado (navegadores viejos): reenviar ambos aborts a un controller
  const controller = new AbortController()
  const forward = () => controller.abort()
  timeoutSignal.addEventListener('abort', forward)
  signal.addEventListener('abort', forward)
  return controller.signal
}

export async function request(endpoint, { method = 'GET', body, signal } = {}) {
  const combined = combineSignals(signal)

  let res
  try {
    res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: combined,
    })
  } catch (err) {
    // El fetch real aborta con AbortError; distinguimos quién abortó.
    if (combined.aborted) {
      if (signal?.aborted) {
        throw new ApiError(0, 'La solicitud fue cancelada', 'aborted', err)
      }
      throw new ApiError(0, 'El servidor tardó demasiado en responder', 'timeout', err)
    }
    throw new ApiError(0, 'No se pudo conectar con el servidor', 'network', err)
  }

  // Error HTTP: JSON con message del servidor, o HTML/parse si no es JSON
  if (!res.ok) {
    if (!isJsonContentType(res)) {
      throw new ApiError(0, 'El servidor devolvió una respuesta inesperada (no es JSON)', 'parse')
    }
    try {
      const data = await res.json()
      throw new ApiError(
        res.status,
        data?.error ?? data?.message ?? `El servicio respondió con estado ${res.status}`,
        'http',
      )
    } catch (err) {
      if (err instanceof ApiError) throw err
      throw new ApiError(res.status, `El servicio respondió con estado ${res.status}`, 'http', err)
    }
  }

  // Éxito: exigimos JSON (una página HTML con 200 = respuesta inesperada)
  if (!isJsonContentType(res)) {
    throw new ApiError(0, 'El servidor devolvió una respuesta inesperada (no es JSON)', 'parse')
  }

  try {
    return await res.json()
  } catch (err) {
    throw new ApiError(0, 'La respuesta del servidor es inválida', 'parse', err)
  }
}