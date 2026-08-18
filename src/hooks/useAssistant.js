import { useCallback, useRef, useState } from 'react'

// Asistente conversacional — conexión al webhook de n8n.
//
// CONTRATO DEL WEBHOOK (n8n):
//   POST https://lito104.app.n8n.cloud/webhook-test/orientar
//   body: { "pregunta": "<contexto con historial + nueva pregunta>" }
//   response 200: la IA responde Markdown (string plano o JSON con clave
//   de texto: respuesta | response | message | text | output)
//
// La memoria del chat se resuelve SIN tocar el backend: cada mensaje
// envía el historial acumulado dentro de "pregunta", por ejemplo:
//   "Historial: [User: hola, IA: hola en que ayudo] - Nueva pregunta: [Tengo un hijo de 4 años]"

const WEBHOOK_URL = 'https://lito104.app.n8n.cloud/webhook-test/orientar'

// Extrae el markdown de la respuesta del webhook, venga como quiera.
const toMarkdown = (data) => {
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
  const [messages, setMessages] = useState([]) // { role: 'user' | 'assistant', content }
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [error, setError] = useState(null)
  const messagesRef = useRef([])

  const sendMessage = useCallback(async (text) => {
    const question = text.trim()
    if (!question) return

    // 1) Guarda el mensaje del usuario en el historial local
    messagesRef.current = [...messagesRef.current, { role: 'user', content: question }]
    setMessages(messagesRef.current)

    // 2) Arma el contexto: historial previo (sin la pregunta nueva) + pregunta
    const historyPart = messagesRef.current
      .slice(0, -1)
      .map((message) => `[${message.role === 'user' ? 'User' : 'IA'}: ${message.content}]`)
      .join(' ')
    const pregunta = `Historial: ${historyPart} - Nueva pregunta: [${question}]`

    setStatus('loading')
    setError(null)
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta }),
      })
      if (!res.ok) {
        throw new Error(`El servicio respondió con estado ${res.status}`)
      }
      const data = await res.json()
      const reply =
        toMarkdown(data) ?? 'No recibí una respuesta clara. Probá reformular la consulta.'

      // 3) Agrega la respuesta de la IA al historial
      messagesRef.current = [...messagesRef.current, { role: 'assistant', content: reply }]
      setMessages(messagesRef.current)
      setStatus('success')
    } catch (err) {
      setError(err.message || 'No se pudo conectar con el asistente')
      setStatus('error')
    }
  }, [])

  const reset = useCallback(() => {
    messagesRef.current = []
    setMessages([])
    setStatus('idle')
    setError(null)
  }, [])

  return { messages, status, error, sendMessage, reset }
}
