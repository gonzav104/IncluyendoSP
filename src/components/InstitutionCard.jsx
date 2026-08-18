import { BadgeCheck, CircleCheck, CircleHelp, CircleX, Phone } from 'lucide-react'
import { isVerified, typeLabel } from '../lib/labels'

// Tarjeta compacta del directorio — lenguaje visual calmo y médico:
// blanca, bordes suaves, esquinas redondeadas, sombra difuminada sutil.

const CUD_STYLES = {
  yes: { Icon: CircleCheck, label: 'Acepta CUD', classes: 'bg-teal-50 text-teal-700' },
  no: { Icon: CircleX, label: 'No acepta CUD', classes: 'bg-slate-100 text-slate-500' },
  unknown: {
    Icon: CircleHelp,
    label: 'CUD a confirmar',
    classes: 'bg-amber-50 text-amber-700',
  },
}

export default function InstitutionCard({ institution, onOpen }) {
  const { name, type, coverage, contact, verification } = institution
  const verified = isVerified(institution)
  const cud = CUD_STYLES[coverage?.cud] ?? CUD_STYLES.unknown
  const { Icon, label: cudLabel, classes: cudClasses } = cud

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${name} — ${typeLabel(type)}. Abrir ficha completa`}
      className="w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-lg font-extrabold leading-snug text-slate-900">
          {name}
        </h3>
        {verified && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-700">
            <BadgeCheck size={12} />
            Verificado
          </span>
        )}
      </div>

      <p className="mt-1 text-sm text-slate-500">{typeLabel(type)}</p>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cudClasses}`}
          title={cudLabel}
        >
          <Icon size={14} />
          CUD
        </span>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-600">
          <Phone size={14} className="text-slate-400" />
          {contact?.phone}
        </span>
      </div>
    </button>
  )
}
