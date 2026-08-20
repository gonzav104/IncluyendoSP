import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import SuggestionModal from './SuggestionModal'

// FR-A11-2: request() reemplaza fetch+res.json() (HTML → ApiError claro,
// nunca SyntaxError); el setTimeout de cierre se limpia en unmount; el modal
// trapea el foco (scroll-lock).

const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const fillAndSubmit = () => {
  fireEvent.change(screen.getByLabelText(/Nombre de la institución/), {
    target: { value: 'Jardín Nº 903' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar sugerencia' }))
}

describe('SuggestionModal — robustez y a11y (FR-A11-2)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('el setTimeout de cierre se limpia al desmontar (sin onClose post-unmount)', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ ok: true })))
    const onClose = vi.fn()

    const { unmount } = render(<SuggestionModal onClose={onClose} />)
    fillAndSubmit()
    await act(async () => {}) // flush del fetch

    expect(screen.getByText(/¡Gracias por colaborar!/)).toBeInTheDocument()

    unmount()
    act(() => {
      vi.advanceTimersByTime(2600)
    })

    expect(onClose).not.toHaveBeenCalled()
  })

  it('respuesta HTML del BFF → mensaje de error claro, sin crashear', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('<html><body>Gateway</body></html>', {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }),
      ),
    )

    render(<SuggestionModal onClose={vi.fn()} />)
    fillAndSubmit()

    await waitFor(() =>
      expect(screen.getByText(/No se pudo enviar la sugerencia/)).toBeInTheDocument(),
    )
    // Mensaje claro (ApiError kind parse), no un SyntaxError crudo ("Unexpected token")
    expect(screen.getByText(/respuesta inesperada \(no es JSON\)/i)).toBeInTheDocument()
  })

  it('al abrir: body sin scroll (scroll-lock)', () => {
    render(<SuggestionModal onClose={vi.fn()} />)

    expect(document.body.style.overflow).toBe('hidden')
  })
})