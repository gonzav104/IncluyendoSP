import { fireEvent, render, screen } from '@testing-library/react'
import Assistant from './Assistant'

// FR-CP-5: Assistant consume el historial vía useAssistant (ChatProvider) y
// renderiza mensajes en orden. T-15: key por id (no index) — la key es
// observable en la reconciliación de React: ids duplicados disparan warning
// de keys duplicadas SOLO si la key es el id.

const { useAssistantMock } = vi.hoisted(() => ({
  useAssistantMock: vi.fn(),
}))

vi.mock('../hooks/useAssistant', () => ({
  default: () => useAssistantMock(),
  toMarkdown: (data) => data,
}))

const baseMock = {
  messages: [],
  status: 'idle',
  error: null,
  sendMessage: vi.fn(),
  reset: vi.fn(),
}

describe('Assistant — chat sobre ChatProvider', () => {
  beforeEach(() => {
    useAssistantMock.mockReturnValue(baseMock)
  })
  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('sin mensajes muestra la bienvenida', () => {
    render(<Assistant />)
    expect(screen.getByText(/Hola 👋/)).toBeInTheDocument()
  })

  it('renderiza los mensajes en orden (user y assistant)', () => {
    useAssistantMock.mockReturnValue({
      ...baseMock,
      messages: [
        { id: 'u1', role: 'user', content: '¿Qué trámites necesito?' },
        { id: 'a1', role: 'assistant', content: 'Primero el CUD.' },
      ],
    })
    render(<Assistant />)
    const userBubble = screen.getByText('¿Qué trámites necesito?')
    const assistantBubble = screen.getByText('Primero el CUD.')
    // El user va a la derecha (ml-auto), el assistant a la izquierda
    expect(userBubble.className).toContain('ml-auto')
    expect(assistantBubble.className).not.toContain('ml-auto')
  })

  it('muestra indicador de escritura y bloquea el input con status loading', () => {
    useAssistantMock.mockReturnValue({ ...baseMock, status: 'loading' })
    render(<Assistant />)
    expect(screen.getByRole('textbox')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled()
  })

  it('envía el mensaje y limpia el input', () => {
    const sendMessage = vi.fn()
    useAssistantMock.mockReturnValue({ ...baseMock, sendMessage })
    render(<Assistant />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hola' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
    expect(sendMessage).toHaveBeenCalledWith('hola')
    expect(screen.getByRole('textbox')).toHaveValue('')
  })

  it('usa key por id: ids duplicados disparan el warning de keys de React', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    useAssistantMock.mockReturnValue({
      ...baseMock,
      messages: [
        { id: 'dup', role: 'user', content: 'uno' },
        { id: 'dup', role: 'assistant', content: 'dos' },
      ],
    })
    render(<Assistant />)
    // React 19 loguea el warning con el mensaje + el id duplicado como args
    const warnedAboutKeys = errorSpy.mock.calls.some(
      ([msg]) => typeof msg === 'string' && msg.includes('same key'),
    )
    expect(warnedAboutKeys).toBe(true)
    errorSpy.mockRestore()
  })
})