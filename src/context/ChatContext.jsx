import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import { API_ENDPOINTS, request } from '../lib/api'
import { MAX_CHAT_MESSAGES, buildPrompt, chatReducer, loadChatFromStorage, saveChatToStorage } from '../lib/chat'
import { toMarkdown } from '../hooks/useAssistant'

// ChatProvider — única fuente de verdad del chat (D11), montado por
// ENCIMA del switch de tabs (FR-CP-1): el historial sobrevive al cambio
// de tab y al refresh (localStorage versionado, FR-CP-2).
// useAssistant (hooks/useAssistant.js) es un wrapper fino de useChat().

const ChatContext = createContext(null)

export function ChatProvider({ children }) {
  // Lazy init desde storage: hidrata o arranca vacío ante storage corrupto
  const [messages, dispatch] = useReducer(chatReducer, undefined, loadChatFromStorage)
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [error, setError] = useState(null)
  const controllerRef = useRef(null)
  const messagesRef = useRef(messages)
  const firstRenderRef = useRef(true)

  // Espejo del estado para armar el prompt sin esperar el re-render
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // Persistencia: skip del primer render (lazy init ya vino del storage)
  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false
      return
    }
    saveChatToStorage(messages)
  }, [messages])

  // Abort en cleanup del provider (FR-AC-4)
  useEffect(() => {
    return () => controllerRef.current?.abort()
  }, [])

  const sendMessage = useCallback(async (text) => {
    const question = text.trim()
    if (!question) return

    // El prompt se arma con el historial previo + la pregunta nueva, con el
    // mismo cap FIFO que aplica el reducer (estado consistente).
    const nextMessages = [...messagesRef.current, { role: 'user', content: question }].slice(
      -MAX_CHAT_MESSAGES,
    )
    const prompt = buildPrompt(nextMessages)

    dispatch({ type: 'ADD_USER', content: question })
    setStatus('loading')
    setError(null)

    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    try {
      const data = await request(API_ENDPOINTS.assistant, {
        method: 'POST',
        body: { prompt },
        signal: controller.signal,
      })
      const reply = toMarkdown(data) ?? 'No recibí una respuesta clara. Probá reformular la consulta.'
      dispatch({ type: 'ADD_ASSISTANT', content: reply })
      setStatus('success')
    } catch (err) {
      if (err?.kind === 'aborted') return // unmount/reset: sin estado fantasma
      setError(err.message || 'No se pudo conectar con el asistente')
      setStatus('error')
    }
  }, [])

  const clearChat = useCallback(() => {
    controllerRef.current?.abort()
    dispatch({ type: 'RESET' })
    setStatus('idle')
    setError(null)
  }, [])

  const value = useMemo(
    () => ({ messages, status, error, sendMessage, clearChat }),
    [messages, status, error, sendMessage, clearChat],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat debe usarse dentro de <ChatProvider>')
  }
  return context
}