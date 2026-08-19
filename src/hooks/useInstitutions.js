import { useCallback, useEffect, useState } from 'react'
import institutionsData from '../data/institutions.json'

// Directorio de instituciones — fuente principal: BFF (incluyendo-sp-api).
//
// CONTRATO DEL ENDPOINT (BFF):
//   GET ${VITE_API_URL}/api/institutions
//   response 200: array de instituciones con el mismo formato que
//   src/data/institutions.json (specialties, coverage, accessibility, etc.)
//
// Estrategia de fallback: si el backend está caído, cargamos los datos
// locales de src/data/institutions.json para no romper la demo.

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/institutions`

export default function useInstitutions() {
  const [institutions, setInstitutions] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const res = await fetch(API_URL)
      if (!res.ok) {
        throw new Error(`El servicio respondió con estado ${res.status}`)
      }
      const data = await res.json()
      setInstitutions(Array.isArray(data) ? data : [])
      setStatus('success')
    } catch (err) {
      // Fallback a datos locales: la demo sigue funcionando sin backend.
      setInstitutions(institutionsData.institutions)
      setError(err.message || 'No se pudo conectar con la API')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { institutions, status, error, load }
}