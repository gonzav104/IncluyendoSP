import { Check, ChevronDown } from 'lucide-react'

// Botón de filtro + menú desplegable — estilo calmo y médico.
// El cierre al hacer clic afuera lo maneja App (listener en document);
// por eso botón y opciones cortan la propagación del click.

export default function FilterDropdown({ label, options, value, onChange, isOpen, onToggle }) {
  const activeOption = options.find((option) => option.value === value)
  const hasSelection = value !== 'all'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onToggle()
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={[
          'flex items-center gap-1 rounded-xl border px-3 py-2 text-sm font-semibold shadow-sm transition-colors',
          hasSelection
            ? 'border-teal-600 bg-teal-600 text-white hover:bg-teal-700'
            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
        ].join(' ')}
      >
        {hasSelection ? activeOption.label : label}
        <ChevronDown size={14} />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-label={label}
          className="absolute left-0 top-full z-20 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
        >
          {options.map((option) => {
            const selected = option.value === value
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={(event) => {
                    event.stopPropagation()
                    onChange(option.value)
                  }}
                  className={[
                    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm',
                    selected
                      ? 'bg-teal-50 font-semibold text-teal-700'
                      : 'text-slate-700 hover:bg-slate-50',
                  ].join(' ')}
                >
                  <span className="flex w-4 shrink-0 justify-center">
                    {selected && <Check size={14} />}
                  </span>
                  {option.label}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
