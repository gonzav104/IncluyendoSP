import { useEffect, useMemo, useState } from 'react'
import { BadgeCheck, Building2, ClipboardList, Plus, RefreshCw, Search, Sparkles } from 'lucide-react'
import proceduresData from './data/procedures.json'
import InstitutionCard from './components/InstitutionCard.jsx'
import InstitutionModal from './components/InstitutionModal.jsx'
import FilterDropdown from './components/FilterDropdown.jsx'
import ProcedureFolder from './components/ProcedureFolder.jsx'
import Assistant from './components/Assistant.jsx'
import SuggestionModal from './components/SuggestionModal.jsx'
import useInstitutions from './hooks/useInstitutions'
import { SPECIALTY_LABELS, specialtyLabel } from './lib/labels'

// Incluyendo SP — estilo "Inclusivo y Calmo": salud moderna, minimalista.
// Directorio con buscador + filtros, guía de trámites y asistente conversacional.

const TABS = [
  { id: 'directorio', label: 'Directorio', icon: Building2 },
  { id: 'guia', label: 'Guía de Trámites', icon: ClipboardList },
  { id: 'asistente', label: 'Asistente IA', icon: Sparkles },
]

const { procedures } = proceduresData

const FILTERS = [
  {
    key: 'specialty',
    label: 'Especialidad',
    options: [
      { value: 'all', label: 'Todas' },
      ...Object.entries(SPECIALTY_LABELS).map(([value, label]) => ({ value, label })),
    ],
  },
  {
    key: 'age',
    label: 'Rango etario',
    options: [
      { value: 'all', label: 'Todas' },
      { value: '0-3', label: '0 a 3 años' },
      { value: '4-6', label: '4 a 6 años' },
      { value: '7-12', label: '7 a 12 años' },
    ],
  },
  {
    key: 'coverage',
    label: 'Cobertura',
    options: [
      { value: 'all', label: 'Todas' },
      { value: 'cud', label: 'Acepta CUD' },
      { value: 'no-cud', label: 'No acepta CUD' },
      { value: 'obra-social', label: 'Acepta obra social' },
    ],
  },
  {
    key: 'verified',
    label: 'Solo verificadas',
    options: [
      { value: 'all', label: 'Todas' },
      { value: 'verified', label: 'Solo verificadas' },
    ],
  },
]

const DEFAULT_FILTERS = { specialty: 'all', age: 'all', coverage: 'all', verified: 'all' }

function App() {
  const [activeTab, setActiveTab] = useState('directorio')
  const [selected, setSelected] = useState(null)
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [openFilter, setOpenFilter] = useState(null)
  const { institutions, status: institutionsStatus, error: institutionsError } = useInstitutions()
  const [suggestionOpen, setSuggestionOpen] = useState(false)

  // Cierra el menú de filtros al hacer clic en cualquier otro lado.
  useEffect(() => {
    if (openFilter === null) return
    const onDocumentClick = () => setOpenFilter(null)
    document.addEventListener('click', onDocumentClick)
    return () => document.removeEventListener('click', onDocumentClick)
  }, [openFilter])

  const filteredInstitutions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return institutions.filter((institution) => {
      // --- Buscador por texto: nombre o especialidad (código o label) ---
      if (normalizedQuery) {
        const matchName = institution.name.toLowerCase().includes(normalizedQuery)
        const matchSpecialty = institution.specialties.some((specialty) => {
          const codeMatch = specialty.toLowerCase().includes(normalizedQuery)
          const labelMatch = specialtyLabel(specialty).toLowerCase().includes(normalizedQuery)
          return codeMatch || labelMatch
        })
        if (!matchName && !matchSpecialty) return false
      }

      // --- Especialidad ---
      if (filters.specialty !== 'all' && !institution.specialties.includes(filters.specialty)) {
        return false
      }

      // --- Rango etario (solapamiento de rangos; null = sin límite) ---
      if (filters.age !== 'all') {
        const [from, to] = filters.age.split('-').map(Number)
        const min = institution.age_range?.min ?? 0
        const max = institution.age_range?.max ?? 999
        if (min > to || max < from) return false
      }

      // --- Cobertura ---
      if (filters.coverage === 'cud' && institution.coverage?.cud !== 'yes') return false
      if (filters.coverage === 'no-cud' && institution.coverage?.cud !== 'no') return false
      if (filters.coverage === 'obra-social') {
        const plans = institution.coverage?.accepted_plans ?? []
        if (!plans.some((plan) => plan !== 'Desconocido')) return false
      }

      // --- Solo verificadas ---
      if (filters.verified === 'verified' && institution.verification?.status !== 'verified') {
        return false
      }

      return true
    })
  }, [query, filters, institutions])

  const hasActiveFilters =
    query.trim() !== '' || Object.values(filters).some((value) => value !== 'all')

  const clearFilters = () => {
    setQuery('')
    setFilters(DEFAULT_FILTERS)
    setOpenFilter(null)
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* ===== Header ===== */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          {/* --- Lado Izquierdo: Bloque de Identidad --- */}
          <div className="flex items-center gap-4">
            <img
              src="/logo_incluyendosp.png"
              alt="Logo Incluyendo SP"
              className="h-24 w-auto object-contain"
            />
            <div className="border-l-2 border-slate-200 h-14 hidden sm:block" aria-hidden="true" />
            <div className="flex flex-col">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-700">
                <BadgeCheck size={12} />
                Directorio verificado
              </span>
              <p className="text-sm text-slate-500">
                Red de recursos sobre neurodiversidad y discapacidad en San Pedro
              </p>
            </div>
          </div>

          {/* --- Lado Derecho: Llamado a la acción --- */}
          <button
            type="button"
            onClick={() => setSuggestionOpen(true)}
            className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30"
          >
            <Plus size={18} />
            Sugerir institución
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-20">
        {/* ===== Pestañas ===== */}
        <div role="tablist" aria-label="Secciones" className="mt-6 inline-flex rounded-2xl bg-slate-100 p-1">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`panel-${id}`}
                onClick={() => setActiveTab(id)}
                className={[
                  'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
                  active
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700',
                ].join(' ')}
              >
                <Icon size={16} />
                {label}
              </button>
            )
          })}
        </div>

        {/* ===== Panel activo ===== */}
        <section
          role="tabpanel"
          id={`panel-${activeTab}`}
          className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          {activeTab === 'directorio' ? (
            /* ================= DIRECTORIO ================= */
            <div>
              {/* Buscador por texto */}
              <div className="relative">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscá por nombre, especialidad…"
                  aria-label="Buscar instituciones"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </div>

              {/* Filtros */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {FILTERS.map((filter) => (
                  <FilterDropdown
                    key={filter.key}
                    label={filter.label}
                    options={filter.options}
                    value={filters[filter.key]}
                    isOpen={openFilter === filter.key}
                    onToggle={() =>
                      setOpenFilter(openFilter === filter.key ? null : filter.key)
                    }
                    onChange={(value) => {
                      setFilters((prev) => ({ ...prev, [filter.key]: value }))
                      setOpenFilter(null)
                    }}
                  />
                ))}

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-teal-700 transition-colors hover:bg-teal-50"
                  >
                    <RefreshCw size={14} />
                    Limpiar filtros
                  </button>
                )}
              </div>

              {/* Resultados */}
              {institutionsStatus === 'loading' && institutions.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center">
                  <p className="font-display text-lg font-extrabold text-slate-700">
                    Cargando instituciones…
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Consultando el directorio
                  </p>
                </div>
              ) : (
                <>
                  {institutionsStatus === 'error' && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700">
                      No se pudo conectar con la API ({institutionsError}) — mostrando datos
                      locales de respaldo.
                    </div>
                  )}
                  <p className="mt-6 text-xs font-semibold text-slate-400">
                    {filteredInstitutions.length} de {institutions.length} instituciones
                  </p>
                  {filteredInstitutions.length > 0 ? (
                    <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredInstitutions.map((institution) => (
                        <InstitutionCard
                          key={institution.id}
                          institution={institution}
                          onOpen={() => setSelected(institution)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                      <p className="font-display text-lg font-extrabold text-slate-700">
                        No hay fichas que coincidan
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-500">
                        Probá con otro término o limpiá los filtros
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : activeTab === 'guia' ? (
            /* ================= GUÍA DE TRÁMITES ================= */
            <div>
              <p className="text-xs font-semibold text-slate-400">Trámites paso a paso</p>
              <div className="mt-2 space-y-4">
                {procedures.map((procedure) => (
                  <ProcedureFolder
                    key={procedure.id}
                    procedure={procedure}
                    dependsOnTitles={(procedure.depends_on ?? []).map(
                      (depId) =>
                        procedures.find((candidate) => candidate.id === depId)?.title ?? depId,
                    )}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* ================= ASISTENTE IA ================= */
            <Assistant />
          )}
        </section>
      </main>

      {/* ===== Modal de institución ===== */}
      {selected && (
        <InstitutionModal institution={selected} onClose={() => setSelected(null)} />
      )}

      {/* ===== Modal de sugerencia ===== */}
      {suggestionOpen && <SuggestionModal onClose={() => setSuggestionOpen(false)} />}
    </div>
  )
}

export default App
