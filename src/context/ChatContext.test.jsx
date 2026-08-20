import { act, renderHook, waitFor } from '@testing-library/react'
import { CHAT_STORAGE_KEY } from '../lib/chat'
import { ChatProvider, useChat } from './ChatContext'

// FR-CP-1/FR-CP-2/FR-CP-3: ChatProvider es única fuente de verdad del chat
// (D11); hidrata desde localStorage versionado y degrada a memoria ante
// cualquier fallo de storage. El prompt sigue incluyendo el historial.

const jsonResponse = (body) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

const seedStorage = (count) => {
  const messages = Array.from({ length: count }, (_, i) => ({
    id: `seed-${i}`,
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `mensaje ${i}`,
    timestamp: i,
  }))
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages))
}

describe('ChatProvider — useChat()', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('sendMessage agrega mensaje de usuario y la respuesta de la IA', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ response: '**respuesta**' })))
    const { result } = renderHook(() => useChat(), { wrapper: ChatProvider })

    act(() => {
      result.current.sendMessage('hola')
    })

    await waitFor(() => expect(result.current.messages).toHaveLength(2))
    expect(result.current.messages[0]).toMatchObject({ role: 'user', content: 'hola' })
    expect(result.current.messages[1]).toMatchObject({ role: 'assistant', content: '**respuesta**' })
    expect(result.current.status).toBe('success')
  })

  it('el prompt enviado incluye el historial completo (FR-CP-4)', async () => {
    // Factory: cada fetch recibe un Response fresco (un Response consumido
    // por res.json() no puede reutilizarse)
    const fetchMock = vi
      .fn()
      .mockImplementation(() => Promise.resolve(jsonResponse({ message: 'ok' })))
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(() => useChat(), { wrapper: ChatProvider })

    act(() => {
      result.current.sendMessage('primera pregunta')
    })
    await waitFor(() => expect(result.current.messages).toHaveLength(2))

    act(() => {
      result.current.sendMessage('segunda pregunta')
    })
    await waitFor(() => expect(result.current.messages).toHaveLength(4))

    const [, options] = fetchMock.mock.calls[1]
    const { prompt } = JSON.parse(options.body)
    expect(prompt).toContain('[User: primera pregunta]')
    expect(prompt).toContain('[IA: ok]')
    expect(prompt).toContain('Nueva pregunta: [segunda pregunta]')
  })

  it('storage corrupto → arranca con historial vacío y sigue funcionando (BR-CP-3)', async () => {
    localStorage.setItem(CHAT_STORAGE_KEY, '{corrupto')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ response: 'ok' })))
    const { result } = renderHook(() => useChat(), { wrapper: ChatProvider })

    expect(result.current.messages).toEqual([])
    act(() => {
      result.current.sendMessage('hola')
    })
    await waitFor(() => expect(result.current.messages).toHaveLength(2))
  })

  it('persiste el historial en localStorage al cambiar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ response: 'ok' })))
    const { result } = renderHook(() => useChat(), { wrapper: ChatProvider })

    act(() => {
      result.current.sendMessage('hola')
    })
    await waitFor(() => expect(result.current.messages).toHaveLength(2))

    const stored = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY))
    expect(stored).toHaveLength(2)
    expect(stored[0]).toMatchObject({ role: 'user', content: 'hola' })
  })

  it('cap 20: al superar el límite se descarta el más viejo', async () => {
    seedStorage(20)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ response: 'ok' })))
    const { result } = renderHook(() => useChat(), { wrapper: ChatProvider })

    expect(result.current.messages).toHaveLength(20)
    act(() => {
      result.current.sendMessage('mensaje 21')
    })
    // Esperamos a que la respuesta llegue (el length 20 ya se cumple con el seed)
    await waitFor(() => {
      const last = result.current.messages[result.current.messages.length - 1]
      expect(last).toMatchObject({ role: 'assistant', content: 'ok' })
    })
    expect(result.current.messages).toHaveLength(20)

    // El más viejo (seed-0) fue descartado; el último es la respuesta nueva
    expect(result.current.messages.some((m) => m.id === 'seed-0')).toBe(false)
    expect(result.current.messages[result.current.messages.length - 1]).toMatchObject({
      role: 'assistant',
      content: 'ok',
    })
  })

  it('clearChat vacía el historial y el storage', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ response: 'ok' })))
    const { result } = renderHook(() => useChat(), { wrapper: ChatProvider })

    await act(async () => {
      await result.current.sendMessage('hola')
    })
    expect(result.current.messages).toHaveLength(2)

    act(() => {
      result.current.clearChat()
    })
    expect(result.current.messages).toEqual([])
    // El estado vacío también se persiste (el storage refleja el estado)
    expect(JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY))).toEqual([])
  })
})