import { useEffect, useRef, useState } from 'react'
import { Building2, Loader2, Send, Sparkles, X } from 'lucide-react'
import { API_ENDPOINTS, request } from '../lib/api'
import useFocusTrap from '../hooks/useFocusTrap'

// Modal de sugerencia de institución — estilo app médica, mismo lenguaje
// visual que InstitutionModal: panel blanco redondeado, sombra suave,
// acentos teal. Envía el formulario al BFF (POST /api/suggestions) con
// request() (FR-A11-2): parsing defensivo, error claro y abort con timeout.

const FIELD_CLASSES =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30'

const LABEL_CLASSES = 'mb-1 block text-xs font-bold text-slate-600'

export default function SuggestionModal({ onClose }) {
  const [form, setForm] = useState({ institution_name: '', specialty: '', contact_info: '' })
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [error, setError] = useState(null)
  const dialogRef = useRef(null)
  const timerRef = useRef(null)
  useFocusTrap(dialogRef)

  // Cierra con Escape (mismo comportamiento que InstitutionModal)
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // El cierre automático post-éxito se limpia al desmontar
  useEffect(() => () => clearTimeout(timerRef.current), [])

  // Cierra solo el formulario; con éxito o error, el usuario decide
  const handleFieldChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const institutionName = form.institution_name.trim()
    if (!institutionName) return // el botón también está disabled, doble barrera

    setStatus('loading')
    setError(null)
    try {
      await request(API_ENDPOINTS.suggestions, {
        method: 'POST',
        // El body va como OBJETO: request() (lib/api.js) es quien serializa
        // con JSON.stringify. Un string aquí se enviaría como JSON anidado
        // (doble stringify) y express.json() del BFF recibiría vacío.
        body: {
          institution_name: institutionName,
          specialty: form.specialty.trim() || null,
          contact_info: form.contact_info.trim() || null,
        },
      })
      setStatus('success')

      // Agradecimiento breve y cierre automático
      timerRef.current = setTimeout(onClose, 2500)
    } catch (err) {
      setError(err?.message || 'No se pudo enviar la sugerencia')
      setStatus('error')
    }
  }

  const canSubmit = form.institution_name.trim().length > 0 && status !== 'loading'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Sugerir institución"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        {/* ===== Cabecera ===== */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <Sparkles size={13} />
              Colaboración de la comunidad
            </p>
            <h2 className="mt-1 font-display text-xl font-extrabold leading-snug text-slate-900">
              Sugerir institución
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* ===== Cuerpo ===== */}
        <div className="p-5">
          {status === 'success' ? (
            /* ===== Estado de éxito: agradecimiento ===== */
            <div className="py-6 text-center">
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                <Send size={24} />
              </span>
              <p className="mt-3 font-display text-lg font-extrabold text-slate-900">
                ¡Gracias por colaborar!
              </p>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Recibimos tu sugerencia. Vamos a revisarla para sumarla al directorio.
              </p>
            </div>
          ) : (
            /* ===== Formulario ===== */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="institution_name" className={LABEL_CLASSES}>
                  Nombre de la institución *
                </label>
                <input
                  id="institution_name"
                  name="institution_name"
                  type="text"
                  value={form.institution_name}
                  onChange={handleFieldChange}
                  placeholder="Ej: Jardín de Infantes Nº 903"
                  required
                  className={FIELD_CLASSES}
                />
              </div>

              <div>
                <label htmlFor="specialty" className={LABEL_CLASSES}>
                  Especialidad
                </label>
                <input
                  id="specialty"
                  name="specialty"
                  type="text"
                  value={form.specialty}
                  onChange={handleFieldChange}
                  placeholder="Ej: fonoaudiología, terapia ocupacional…"
                  className={FIELD_CLASSES}
                />
              </div>

              <div>
                <label htmlFor="contact_info" className={LABEL_CLASSES}>
                  Contacto de la institución (si lo sabés)
                </label>
                <input
                  id="contact_info"
                  name="contact_info"
                  type="text"
                  value={form.contact_info}
                  onChange={handleFieldChange}
                  placeholder="Ej: teléfono o dirección de la institución"
                  className={FIELD_CLASSES}
                />
              </div>

              {status === 'error' && error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                  No se pudo enviar la sugerencia: {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30 disabled:opacity-50"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Enviando…
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Enviar sugerencia
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* ===== Pie sutil ===== */}
        {status !== 'success' && (
          <div className="flex items-center justify-center gap-1.5 border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs font-medium text-slate-400">
            <Building2 size={12} />
            Lo revisamos antes de publicar
          </div>
        )}
      </div>
    </div>
  )
}
