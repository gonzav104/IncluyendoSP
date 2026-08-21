import { useCallback, useEffect, useRef, useState } from 'react'
import institutionsData from '../data/institutions.json'
import { API_ENDPOINTS, request } from '../lib/api'
import { normalizeInstitution } from '../lib/normalizers'

// Directorio de instituciones — local-first (D19).
//
// CONTRATO DEL ENDPOINT (BFF):
//   GET ${VITE_API_URL}/api/institutions
//   response 200: array de instituciones con el mismo formato que
//   src/data/institutions.json (specialties, coverage, accessibility, etc.)
//
// Estrategia: la data local es la fuente INMEDIATA (status 'success' desde
// el montaje, sin pantalla de carga); el remoto se carga en background y,
// si responde, hace swap silencioso con data normalizada; si falla, se
// mantiene la local con `isLocal: true` y el error queda disponible para el
// banner amber (FR-PF-4). Abort en cleanup (kind === 'aborted' se ignora).

export default function useInstitutions() {
  const [institutions, setInstitutions] = useState(() =>
    institutionsData.institutions.map(normalizeInstitution),
  )
  const [status, setStatus] = useState('success') // idle | loading | success | error
  const [error, setError] = useState(null)
  const [isLocal, setIsLocal] = useState(true)
  const controllerRef = useRef(null)

  const load = useCallback(async () => {
    // D19: durante el fetch background (y el reintento manual) el status pasa
    // a 'loading' — el botón Reintentar muestra spinner/disabled. El error
    // previo NO se limpia acá: persiste durante la recarga (banner amber
    // visible con spinner) y se descarta recién si el remoto responde.
    setStatus('loading')
    const controller = new AbortController()
    controllerRef.current = controller
    try {
      const data = await request(API_ENDPOINTS.institutions, { signal: controller.signal })
      setInstitutions(data.map(normalizeInstitution))
      setIsLocal(false)
      setError(null)
      setStatus('success')
    } catch (err) {
      // Abort por unmount: no tocar estado
      if (err?.kind === 'aborted') return
      // Fallback: la demo sigue con la data local, el banner amber avisa
      setError(err?.message || 'No se pudo conectar con la API')
      setIsLocal(true)
      setStatus('success')
    }
  }, [])

  useEffect(() => {
    load()
    return () => controllerRef.current?.abort()
  }, [load])

  return { institutions, status, error, isLocal, load }
}