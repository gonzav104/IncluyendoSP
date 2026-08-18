import { useState } from 'react'
import {
  CalendarClock,
  ChevronDown,
  Clock,
  ExternalLink,
  Folder,
  FolderOpen,
  Link2,
  ListChecks,
  ListOrdered,
  MapPin,
  Phone,
  RefreshCw,
} from 'lucide-react'
import { categoryLabel } from '../lib/labels'

// Trámite en acordeón — tarjeta limpia que se expande mostrando
// resumen, requisitos, pasos numerados, enlaces y contactos.

const SECTION_TITLE = 'mb-2 text-xs font-bold uppercase tracking-wide text-slate-400'

// El JSON puede traer URL con anotaciones ("https://... (VERIFICAR)") —
// solo renderizamos como link si la URL es válida.
const safeHref = (url) => {
  const match = /^https?:\/\/[^\s]+/.exec(url ?? '')
  return match ? match[0] : null
}

export default function ProcedureFolder({ procedure, dependsOnTitles = [] }) {
  const [open, setOpen] = useState(false)

  const {
    title,
    summary,
    category,
    audience,
    requirements = [],
    steps = [],
    estimated_time,
    validity,
    official_links = [],
    local_contacts = [],
    last_reviewed_at,
  } = procedure

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* ===== Tapa del trámite ===== */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 bg-white px-5 py-4 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
      >
        <span className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            {open ? (
              <FolderOpen size={20} />
            ) : (
              <Folder size={20} />
            )}
          </span>
          <span className="flex flex-col items-start gap-0.5">
            <span className="font-display text-base font-extrabold leading-snug text-slate-900">
              {title}
            </span>
            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
              {categoryLabel(category)}
            </span>
          </span>
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* ===== Contenido expandido ===== */}
      {open && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
          {/* Resumen */}
          <p className="text-sm leading-relaxed text-slate-600">{summary}</p>

          {audience && (
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Pensado para: {audience}
            </p>
          )}

          {dependsOnTitles.length > 0 && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
              <Link2 size={13} />
              Requiere antes: {dependsOnTitles.join(', ')}
            </p>
          )}

          {/* Requisitos */}
          {requirements.length > 0 && (
            <section className="mt-4">
              <h3 className={SECTION_TITLE}>Requisitos</h3>
              <ul className="space-y-1.5">
                {requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <ListChecks
                      size={15}
                      className="mt-0.5 shrink-0 text-teal-500"
                    />
                    <span className="text-slate-700">
                      <span className="font-semibold text-slate-800">
                        {requirement.document}
                      </span>
                      {requirement.detail && (
                        <span className="text-slate-500"> — {requirement.detail}</span>
                      )}
                    </span>
                    <span
                      className={`ml-auto shrink-0 self-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        requirement.required
                          ? 'bg-teal-100 text-teal-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {requirement.required ? 'Obligatorio' : 'Opcional'}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Pasos numerados */}
          {steps.length > 0 && (
            <section className="mt-5">
              <h3 className={SECTION_TITLE}>Pasos</h3>
              <ol className="space-y-3">
                {steps
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((step) => (
                    <li key={step.order} className="flex gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
                        {step.order}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{step.title}</p>
                        <p className="mt-0.5 text-sm text-slate-600">{step.description}</p>
                        {step.where && step.where !== '—' && (
                          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-400">
                            <MapPin size={12} /> {step.where}
                          </p>
                        )}
                        {step.duration && step.duration !== '—' && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-slate-400">
                            <Clock size={12} /> {step.duration}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
              </ol>
            </section>
          )}

          {/* Enlaces oficiales */}
          {official_links.length > 0 && (
            <section className="mt-5">
              <h3 className={SECTION_TITLE}>Dónde se gestiona</h3>
              <ul className="space-y-1.5">
                {official_links.map((link, index) => {
                  const href = safeHref(link.url)
                  return (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 font-semibold text-teal-700 underline decoration-2 underline-offset-2 hover:text-teal-800"
                        >
                          <ExternalLink size={14} />
                          {link.label} ({link.entity})
                        </a>
                      ) : (
                        <span className="text-slate-500">{link.label} — URL a verificar</span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {/* Contactos locales */}
          {local_contacts.length > 0 && (
            <section className="mt-5">
              <h3 className={SECTION_TITLE}>Contactos locales</h3>
              <ul className="space-y-2">
                {local_contacts.map((contact, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Phone size={15} className="mt-0.5 shrink-0 text-slate-400" />
                    <span className="text-slate-700">
                      <span className="font-semibold text-slate-800">{contact.entity}</span>
                      {contact.description && (
                        <span className="text-slate-500"> — {contact.description}</span>
                      )}
                      {contact.phone && (
                        <span className="block text-xs text-slate-400">{contact.phone}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Meta */}
          {(estimated_time || validity || last_reviewed_at) && (
            <div className="mt-5 space-y-1 border-t border-slate-200 pt-3 text-xs text-slate-400">
              {estimated_time && (
                <p className="flex items-center gap-1.5">
                  <Clock size={12} /> Tiempo estimado: {estimated_time}
                </p>
              )}
              {validity && (
                <p className="flex items-center gap-1.5">
                  <RefreshCw size={12} /> {validity}
                </p>
              )}
              {last_reviewed_at && (
                <p className="flex items-center gap-1.5">
                  <CalendarClock size={12} /> Revisado: {last_reviewed_at}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
