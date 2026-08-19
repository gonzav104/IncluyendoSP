import { useCallback, useRef, useState } from 'react'

// Asistente conversacional — conexión al BFF (incluyendo-sp-api).
//
// CONTRATO DEL ENDPOINT (BFF):
//   POST http://localhost:3000/api/assistant
//   body: { "prompt": "<contexto con historial + nueva pregunta>" }
//   El backend reenvía el prompt a n8n y devuelve su respuesta.
//   response 200: la IA responde Markdown (string plano o JSON con clave
//   de texto: respuesta | response | message | text | output)
//
// La memoria del chat se resuelve SIN tocar el backend: cada mensaje
// envía el historial acumulado dentro de "prompt", por ejemplo:
//   "Historial: [User: hola, IA: hola en que ayudo] - Nueva pregunta: [Tengo un hijo de 4 años]"

const WEBHOOK_URL = 'http://localhost:3000/api/assistant'

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
    const prompt = `Historial: ${historyPart} - Nueva pregunta: [${question}]`

    setStatus('loading')
    setError(null)
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
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
