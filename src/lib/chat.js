// Dominio del chat: reducer puro + helpers de storage (D13).
// Persistencia versionada con try/catch: cualquier fallo degrada a
// memoria sin romper el chat (BR-CP-3). Cap FIFO de 20 mensajes (BR-CP-2)
// — el prompt ya incluye el historial; el cap evita prompts gigantes.

export const CHAT_STORAGE_KEY = 'incluyendosp.chat.v1'
export const MAX_CHAT_MESSAGES = 20

let idCounter = 0

// crypto.randomUUID requiere contexto seguro; fallback contador (gotcha c)
export function genId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  idCounter += 1
  return `msg-${Date.now()}-${idCounter}`
}

const appendWithCap = (messages, message) => {
  const next = [...messages, message]
  return next.length > MAX_CHAT_MESSAGES ? next.slice(next.length - MAX_CHAT_MESSAGES) : next
}

export function chatReducer(state, action) {
  switch (action.type) {
    case 'ADD_USER':
      return appendWithCap(state, {
        id: genId(),
        role: 'user',
        content: action.content,
        timestamp: Date.now(),
      })
    case 'ADD_ASSISTANT':
      return appendWithCap(state, {
        id: genId(),
        role: 'assistant',
        content: action.content,
        timestamp: Date.now(),
      })
    case 'RESET':
      return []
    default:
      return state
  }
}

// "Historial: [User: ..] [IA: ..] - Nueva pregunta: [..]"
// El historial son los mensajes previos; el último es la nueva pregunta.
export function buildPrompt(messages) {
  const historyPart = messages
    .slice(0, -1)
    .map((message) => `[${message.role === 'user' ? 'User' : 'IA'}: ${message.content}]`)
    .join(' ')
  const last = messages[messages.length - 1]
  return `Historial: ${historyPart} - Nueva pregunta: [${last?.content ?? ''}]`
}

const isValidMessage = (message) =>
  message &&
  typeof message === 'object' &&
  (message.role === 'user' || message.role === 'assistant') &&
  typeof message.content === 'string'

export function loadChatFromStorage() {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY)
    if (raw == null) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const valid = parsed.filter(isValidMessage)
    return valid.slice(valid.length - MAX_CHAT_MESSAGES)
  } catch {
    return []
  }
}

export function saveChatToStorage(messages) {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages))
  } catch {
    // Silencioso: storage lleno/privacidad → el chat sigue en memoria
  }
}