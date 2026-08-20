import { act, fireEvent, render, renderHook, waitFor } from '@testing-library/react'
import { ChatProvider } from '../context/ChatContext'
import useAssistant, { toMarkdown } from './useAssistant'

// D12: toMarkdown es unit puro (extrae el markdown de la respuesta del BFF
// venga como venga); D11: useAssistant es wrapper fino de useChat() con la
// misma API pública de siempre { messages, status, error, sendMessage, reset }.

describe('toMarkdown — extracción de la respuesta (D12)', () => {
  it('string directo → recortado', () => {
    expect(toMarkdown('  hola  ')).toBe('hola')
  })

  it('JSON con cualquier clave de texto → contenido', () => {
    expect(toMarkdown({ respuesta: 'a' })).toBe('a')
    expect(toMarkdown({ response: 'b' })).toBe('b')
    expect(toMarkdown({ message: 'c' })).toBe('c')
    expect(toMarkdown({ text: 'd' })).toBe('d')
    expect(toMarkdown({ output: 'e' })).toBe('e')
  })

  it('null / vacío / sin clave de texto → null', () => {
    expect(toMarkdown(null)).toBeNull()
    expect(toMarkdown(undefined)).toBeNull()
    expect(toMarkdown('')).toBeNull()
    expect(toMarkdown('   ')).toBeNull()
    expect(toMarkdown({})).toBeNull()
    expect(toMarkdown({ otra: 'cosa' })).toBeNull()
  })

  it('markdown con código, listas y negritas se conserva intacto', () => {
    const md = '**Paso 1**\n\n- item uno\n- item dos\n\n```js\nconst a = 1\n```'
    expect(toMarkdown(md)).toBe(md)
  })
})

describe('useAssistant — wrapper fino de useChat (D11)', () => {
  it('expone la API pública { messages, status, error, sendMessage, reset }', () => {
    const { result } = renderHook(() => useAssistant(), { wrapper: ChatProvider })

    expect(Array.isArray(result.current.messages)).toBe(true)
    expect(typeof result.current.sendMessage).toBe('function')
    expect(typeof result.current.reset).toBe('function')
    expect(['idle', 'loading', 'success', 'error']).toContain(result.current.status)
    expect(result.current.error).toBeNull()
  })

  it('reset vacía el historial (mapea clearChat del contexto)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ response: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(() => useAssistant(), { wrapper: ChatProvider })

    await act(async () => {
      await result.current.sendMessage('hola')
    })
    expect(result.current.messages).toHaveLength(2)

    act(() => {
      result.current.reset()
    })
    expect(result.current.messages).toEqual([])
    expect(result.current.status).toBe('idle')

    vi.unstubAllGlobals()
  })

  it('el historial vive en el ChatProvider: dos hooks comparten estado', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ response: 'ok' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      ),
    )

    // Un único provider con dos instancias del hook (los renderHook separados
    // montan providers distintos — no comparten contexto).
    function Bridge() {
      const first = useAssistant()
      const second = useAssistant()
      return (
        <div>
          <span data-testid="count-a">{first.messages.length}</span>
          <span data-testid="count-b">{second.messages.length}</span>
          <button type="button" onClick={() => first.sendMessage('hola')}>
            Enviar
          </button>
        </div>
      )
    }
    const { getByTestId, getByRole } = render(
      <ChatProvider>
        <Bridge />
      </ChatProvider>,
    )

    fireEvent.click(getByRole('button', { name: 'Enviar' }))

    await waitFor(() => expect(getByTestId('count-a')).toHaveTextContent('2'))
    // El segundo hook ve lo que envió el primero: estado compartido (D11)
    expect(getByTestId('count-b')).toHaveTextContent('2')

    vi.unstubAllGlobals()
  })
})