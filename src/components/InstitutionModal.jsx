import { useEffect } from 'react'
import {
  CalendarClock,
  CircleCheck,
  CircleHelp,
  CircleX,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  StickyNote,
  Users,
  X,
} from 'lucide-react'
import {
  ACCESSIBILITY_ITEMS,
  CUD_LABELS,
  formatAgeRange,
  formatPlans,
  isVerified,
  STATUS_LABELS,
  specialtyLabel,
  typeLabel,
} from '../lib/labels'
import InstitutionMap from './InstitutionMap.jsx'

// Modal de detalle — estilo app médica: panel blanco redondeado,
// sombra suave difuminada, secciones con rótulos calmos.

const SECTION_TITLE =
  'mb-2 text-xs font-bold uppercase tracking-wide text-slate-400'

const CUD_ICON = {
  yes: { Icon: CircleCheck, className: 'text-teal-600' },
  no: { Icon: CircleX, className: 'text-slate-400' },
  unknown: { Icon: CircleHelp, className: 'text-amber-500' },
}

const chip = 'rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700'

export default function InstitutionModal({ institution, onClose }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const {
    id,
    name,
    type,
    specialties,
    age_range,
    address,
    contact,
    coverage,
    accessibility,
    services,
    verification,
  } = institution

  const verified = isVerified(institution)
  const cud = CUD_ICON[coverage?.cud] ?? CUD_ICON.unknown

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Ficha: ${name}`}
        onClick={(event) => event.stopPropagation()}
        className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        {/* ===== Cabecera ===== */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <FileText size={13} />
              Ficha {id}
            </p>
            <h2 className="mt-1 font-display text-xl font-extrabold leading-snug text-slate-900">
              {name}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">{typeLabel(type)}</p>
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

        <div className="space-y-6 p-5">
          {/* ===== Especialidades ===== */}
          <section>
            <h3 className={SECTION_TITLE}>Especialidades</h3>
            <div className="flex flex-wrap gap-1.5">
              {specialties.map((specialty) => (
                <span key={specialty} className={chip}>
                  {specialtyLabel(specialty)}
                </span>
              ))}
            </div>
          </section>

          {/* ===== Rango etario ===== */}
          <section>
            <h3 className={SECTION_TITLE}>Rango etario</h3>
            <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Users size={16} className="text-slate-400" />
              {formatAgeRange(age_range)}
            </p>
          </section>

          {/* ===== Accesibilidad ===== */}
          <section>
            <h3 className={SECTION_TITLE}>Accesibilidad</h3>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ACCESSIBILITY_ITEMS.map(({ key, label, icon: Icon }) => {
                const available = accessibility?.[key]
                return (
                  <li
                    key={key}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium ${
                      available
                        ? 'border-teal-100 bg-teal-50/50 text-slate-800'
                        : 'border-slate-200 bg-white text-slate-500'
                    }`}
                  >
                    <Icon
                      size={16}
                      className={available ? 'shrink-0 text-teal-600' : 'shrink-0 text-slate-300'}
                    />
                    {label}
                    {available ? (
                      <CircleCheck size={14} className="ml-auto shrink-0 text-teal-600" />
                    ) : (
                      <CircleX size={14} className="ml-auto shrink-0 text-slate-300" />
                    )}
                  </li>
                )
              })}
            </ul>
          </section>

          {/* ===== Cobertura ===== */}
          <section>
            <h3 className={SECTION_TITLE}>Cobertura</h3>
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <cud.Icon size={16} className={cud.className} />
                {CUD_LABELS[coverage?.cud] ?? CUD_LABELS.unknown}
              </p>
              <p className="text-sm text-slate-500">
                Obra social:{' '}
                <span className="font-semibold text-slate-700">
                  {formatPlans(coverage?.accepted_plans)}
                </span>
              </p>
            </div>
          </section>

          {/* ===== Contacto y dirección ===== */}
          <section>
            <h3 className={SECTION_TITLE}>Contacto</h3>
            <ul className="space-y-1.5 text-sm font-medium text-slate-700">
              {contact?.phone && (
                <li className="flex items-center gap-2">
                  <Phone size={15} className="text-slate-400" /> {contact.phone}
                </li>
              )}
              {contact?.whatsapp && (
                <li className="flex items-center gap-2">
                  <MessageCircle size={15} className="text-slate-400" /> {contact.whatsapp}
                </li>
              )}
              {contact?.email && (
                <li className="flex items-center gap-2">
                  <Mail size={15} className="text-slate-400" /> {contact.email}
                </li>
              )}
              {address && (
                <li className="flex items-start gap-2">
                  <MapPin size={15} className="mt-0.5 shrink-0 text-slate-400" />
                  <span className="text-slate-600">
                    {address.street}
                    {address.neighborhood ? ` · ${address.neighborhood}` : ''}
                    {address.city ? ` · ${address.city}` : ''}
                    {address.postal_code ? ` (CP ${address.postal_code})` : ''}
                  </span>
                </li>
              )}
            </ul>
          </section>

          {/* ===== Mapa ===== */}
          {institution?.address?.coordinates?.lat && institution?.address?.coordinates?.lng && (
            <section>
              <h3 className={SECTION_TITLE}>Ubicación</h3>
              <InstitutionMap institution={institution} />
            </section>
          )}

          {/* ===== Servicios ===== */}
          {services?.length > 0 && (
            <section>
              <h3 className={SECTION_TITLE}>Servicios</h3>
              <ul className="flex flex-wrap gap-1.5">
                {services.map((service) => (
                  <li key={service} className={chip}>
                    {service}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ===== Verificación ===== */}
          <section className="rounded-xl border border-teal-100 bg-teal-50/60 p-3">
            <h3 className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-teal-700">
              <ShieldCheck size={15} className={verified ? 'text-teal-600' : 'text-slate-400'} />
              {STATUS_LABELS[verification?.status] ?? 'Estado de verificación'}
            </h3>
            <ul className="space-y-1 text-xs text-slate-600">
              {verification?.verified_at && (
                <li className="flex items-center gap-1.5">
                  <CalendarClock size={13} className="text-slate-400" /> Verificado el{' '}
                  {verification.verified_at}
                </li>
              )}
              {verification?.source && <li>Fuente: {verification.source}</li>}
              {verification?.notes && (
                <li className="flex items-start gap-1.5">
                  <StickyNote size={13} className="mt-0.5 shrink-0 text-slate-400" />
                  {verification.notes}
                </li>
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
