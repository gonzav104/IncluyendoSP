import { useEffect, useRef, useState } from 'react'
import { RefreshCw, Send, Sparkles } from 'lucide-react'
import useAssistant from '../hooks/useAssistant'
import { AssistantMarkdown } from '../lib/markdown.jsx'

// Asistente conversacional: chat continuo estilo WhatsApp/ChatGPT.
// Burbujas de usuario y de IA (Markdown renderizado), input fijo abajo.
// La memoria se envía al webhook dentro de "pregunta" como historial.

const WELCOME =
  'Hola 👋 Soy el asistente de orientación de **Incluyendo SP**. Contame tu situación (edad del niño/a, diagnóstico, qué te preocupa) y te ayudo a armar los primeros pasos.'

export default function Assistant() {
  const [query, setQuery] = useState('')
  const { messages, status, error, sendMessage, reset } = useAssistant()
  const endRef = useRef(null)

  const loading = status === 'loading'
  const canSend = query.trim().length > 0 && !loading

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!canSend) return
    sendMessage(query)
    setQuery('')
  }

  // Auto-scroll al último mensaje
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, loading])

  return (
    <div className="flex h-[32rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
      {/* ===== Cabecera del chat ===== */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <span className="flex size-8 items-center justify-center rounded-full bg-teal-100 text-teal-700">
            <Sparkles size={16} />
          </span>
          Asistente de orientación
        </p>
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <RefreshCw size={13} />
          Nueva conversación
        </button>
      </div>

      {/* ===== Mensajes ===== */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="w-fit max-w-[85%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
            <AssistantMarkdown>{WELCOME}</AssistantMarkdown>
          </div>
        )}

        {messages.map((message, index) =>
          message.role === 'user' ? (
            <div
              key={index}
              className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-md bg-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm"
            >
              {message.content}
            </div>
          ) : (
            <div
              key={index}
              className="w-fit max-w-[85%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm"
            >
              <AssistantMarkdown>{message.content}</AssistantMarkdown>
            </div>
          ),
        )}

        {/* Indicador de escritura */}
        {loading && (
          <div className="flex w-fit items-center gap-1.5 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="size-2 animate-bounce rounded-full bg-teal-500" />
            <span className="size-2 animate-bounce rounded-full bg-teal-500 [animation-delay:150ms]" />
            <span className="size-2 animate-bounce rounded-full bg-teal-500 [animation-delay:300ms]" />
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* ===== Error (sobre el input) ===== */}
      {status === 'error' && error && (
        <div className="border-t border-slate-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600">
          No se pudo conectar con el asistente ({error}). Verificá que el webhook de n8n esté
          activo.
        </div>
      )}

      {/* ===== Input fijo abajo ===== */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-slate-200 bg-white p-3"
      >
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Escribí tu consulta…"
          aria-label="Escribí tu consulta"
          disabled={loading}
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:opacity-50"
        >
          <Send size={15} />
          Enviar
        </button>
      </form>
    </div>
  )
}
