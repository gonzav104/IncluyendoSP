import { useChat } from '../context/ChatContext'

// Asistente conversacional — wrapper fino del ChatProvider (D11).
// El historial vive en el contexto (persistido en localStorage, cap 20);
// useAssistant conserva la misma API pública de siempre para no romper
// el consumo de Assistant.jsx: { messages, status, error, sendMessage, reset }.
//
// El POST a /api/assistant lo hace ChatProvider con el prompt armado por
// buildPrompt (historial + nueva pregunta) — contrato BFF intacto.

// Extrae el markdown de la respuesta del webhook, venga como quiera.
export const toMarkdown = (data) => {
  if (data == null) return null
  if (typeof data === 'string') return data.trim() || null
  const text =
    data.respuesta ??
    data.response ??
    data.message ??
    data.text ??
    data.output ??
    null
  return typeof text === 'string' && text.trim() ? text.trim() : null
}

export default function useAssistant() {
  const { messages, status, error, sendMessage, clearChat } = useChat()

  return {
    messages,
    status,
    error,
    sendMessage,
    reset: clearChat,
  }
}