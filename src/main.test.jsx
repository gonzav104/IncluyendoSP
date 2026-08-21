import { act, fireEvent, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { ChatProvider } from './context/ChatContext'

// FR-CP-1 (fix del verify-report): el árbol REAL de main.jsx debe montar
// <ChatProvider>. Test de integración del entrypoint: capturamos el árbol que
// main.jsx entrega a createRoot y lo renderizamos COMPLETO — sin vi.mock de
// Assistant ni de useAssistant. El punto es ejercitar el árbol real y detectar
// el crash del tab "Asistente IA" (useChat sin provider desmonta la app).

const { rootRender } = vi.hoisted(() => ({ rootRender: vi.fn() }))

vi.mock('react-dom/client', () => ({
  createRoot: () => ({ render: rootRender }),
}))

// Importar main.jsx DESPUÉS del mock (hoisted): ejecuta createRoot y
// captura el árbol real en rootRender.
await import('./main.jsx')

const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

describe('main.jsx — árbol real con ChatProvider (FR-CP-1)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('monta ChatProvider y el tab Asistente IA renderiza sin crashear', async () => {
    // Único mock de red: el fetch background del directorio (hook real, sin
    // mocks de componentes). El asistente no llama fetch hasta enviar un mensaje.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([])))

    const element = rootRender.mock.calls[0][0]

    // El árbol que main.jsx entrega a createRoot DEBE envolver App en
    // ChatProvider (FR-CP-1): con el código viejo esto es <App/> pelado.
    expect(element.type).toBe(StrictMode)
    expect(element.props.children.type).toBe(ChatProvider)

    render(element)

    // El directorio pinta con el hook real (data local de institutions.json)
    expect(screen.getByLabelText('Buscar instituciones')).toBeInTheDocument()

    // Click en el tab Asistente IA: monta el Assistant REAL (lazy → chunk)
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Asistente IA' }))
    })

    // Sin crash: el asistente renderiza su cabecera y su input. Con el código
    // viejo (sin ChatProvider) useChat() tira error y React desmonta el árbol.
    // findBy* espera el ciclo lazy → Suspense → render del chunk real.
    // Timeout generoso: en runs completos (19 suites) el chunk lazy tarda >1s
    // por contención de CPU y el default de 1000ms expira (falso negativo).
    expect(
      await screen.findByText('Asistente de orientación', { timeout: 5000 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Escribí tu consulta' })).toBeInTheDocument()
    expect(screen.getByText(/Hola 👋/)).toBeInTheDocument()
  })
})