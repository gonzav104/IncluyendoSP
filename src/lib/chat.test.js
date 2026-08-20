import {
  CHAT_STORAGE_KEY,
  MAX_CHAT_MESSAGES,
  buildPrompt,
  chatReducer,
  genId,
  loadChatFromStorage,
  saveChatToStorage,
} from './chat'

// FR-CP-2/FR-CP-3: storage versionado con try/catch (degradación a memoria)
// y cap FIFO de 20 mensajes. Mensaje: { id, role, content, timestamp }.

const makeMessage = (role, content, index) => ({
  id: `m-${index}`,
  role,
  content,
  timestamp: index,
})

describe('chatReducer — cap FIFO de 20 mensajes (BR-CP-2)', () => {
  it('ADD_USER agrega mensaje de usuario al final', () => {
    const next = chatReducer([], { type: 'ADD_USER', content: 'hola' })
    expect(next).toHaveLength(1)
    expect(next[0]).toMatchObject({ role: 'user', content: 'hola' })
    expect(typeof next[0].id).toBe('string')
    expect(typeof next[0].timestamp).toBe('number')
  })

  it('ADD_ASSISTANT agrega mensaje de la IA', () => {
    const base = chatReducer([], { type: 'ADD_USER', content: 'hola' })
    const next = chatReducer(base, { type: 'ADD_ASSISTANT', content: '**respuesta**' })
    expect(next).toHaveLength(2)
    expect(next[1]).toMatchObject({ role: 'assistant', content: '**respuesta**' })
  })

  it('al superar 20 descarta el más viejo (FIFO) y preserva el orden', () => {
    let state = []
    for (let i = 1; i <= MAX_CHAT_MESSAGES + 1; i++) {
      state = chatReducer(state, { type: 'ADD_USER', content: `msg ${i}` })
    }
    expect(state).toHaveLength(MAX_CHAT_MESSAGES)
    expect(state[0].content).toBe('msg 2')
    expect(state[state.length - 1].content).toBe(`msg ${MAX_CHAT_MESSAGES + 1}`)
  })

  it('RESET vacía el historial', () => {
    let state = []
    for (let i = 0; i < 3; i++) {
      state = chatReducer(state, { type: 'ADD_USER', content: `m${i}` })
    }
    expect(chatReducer(state, { type: 'RESET' })).toEqual([])
  })
})

describe('buildPrompt — historial + nueva pregunta (FR-CP-4)', () => {
  it('incluye todos los mensajes previos y la última como nueva pregunta', () => {
    const messages = [
      makeMessage('user', 'tengo un hijo de 4 años', 1),
      makeMessage('assistant', 'contame más', 2),
      makeMessage('user', 'tiene TEA', 3),
    ]
    const prompt = buildPrompt(messages)
    expect(prompt).toContain('[User: tengo un hijo de 4 años]')
    expect(prompt).toContain('[IA: contame más]')
    expect(prompt).toContain('Nueva pregunta: [tiene TEA]')
    // El historial excluye la última pregunta
    expect(prompt).not.toContain('[User: tiene TEA]')
  })

  it('con un solo mensaje, el historial queda vacío', () => {
    const prompt = buildPrompt([makeMessage('user', 'hola', 1)])
    expect(prompt).toContain('Nueva pregunta: [hola]')
    // Sin mensajes previos → nada entre "Historial:" y "- Nueva pregunta"
    expect(prompt).not.toMatch(/\[(User|IA):/)
  })
})

describe('loadChatFromStorage — degradación ante storage corrupto (BR-CP-3)', () => {
  afterEach(() => localStorage.clear())

  it('JSON corrupto → historial vacío', () => {
    localStorage.setItem(CHAT_STORAGE_KEY, '{no-json')
    expect(loadChatFromStorage()).toEqual([])
  })

  it('shape inválido (no array / items sin role-content) → vacío filtrado', () => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({ a: 1 }))
    expect(loadChatFromStorage()).toEqual([])

    localStorage.setItem(
      CHAT_STORAGE_KEY,
      JSON.stringify([
        { id: 'x', role: 'user', content: 'válido' },
        { id: 'y', role: 'admin', content: 'rol inválido' },
        { id: 'z', role: 'assistant' },
        'string inválida',
      ]),
    )
    const loaded = loadChatFromStorage()
    expect(loaded).toHaveLength(1)
    expect(loaded[0]).toMatchObject({ role: 'user', content: 'válido' })
  })

  it('más de 20 mensajes → trunca conservando los últimos (FIFO)', () => {
    const messages = Array.from({ length: 25 }, (_, i) => makeMessage('user', `m${i}`, i))
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages))
    const loaded = loadChatFromStorage()
    expect(loaded).toHaveLength(MAX_CHAT_MESSAGES)
    expect(loaded[0].content).toBe('m5')
    expect(loaded[loaded.length - 1].content).toBe('m24')
  })
})

describe('saveChatToStorage — fallo silencioso (BR-CP-3)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('persiste mensajes válidos', () => {
    const messages = [makeMessage('user', 'hola', 1)]
    saveChatToStorage(messages)
    expect(loadChatFromStorage()).toEqual(messages)
  })

  it('error de storage (quota/privacidad) → no lanza', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(() => saveChatToStorage([makeMessage('user', 'hola', 1)])).not.toThrow()
  })
})

describe('genId — randomUUID con fallback contador (gotcha c)', () => {
  it('usa crypto.randomUUID cuando está disponible', () => {
    if (typeof crypto?.randomUUID !== 'function') return // entorno sin crypto
    const id = genId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(10)
  })

  it('fallback: sin randomUUID genera ids únicos con contador', () => {
    const cryptoRef = globalThis.crypto
    Object.defineProperty(cryptoRef, 'randomUUID', {
      value: undefined,
      configurable: true,
      writable: true,
    })
    try {
      const first = genId()
      const second = genId()
      expect(first).not.toBe(second)
      expect(first).toMatch(/^msg-/)
    } finally {
      Object.defineProperty(cryptoRef, 'randomUUID', {
        value: cryptoRef.randomUUID, // restauramos el original si existía
        configurable: true,
        writable: true,
      })
    }
  })
})