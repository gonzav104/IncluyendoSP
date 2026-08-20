import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'

// Smoke test de la fase 0: verifica que la config completa funciona —
// jsdom (environment), RTL render y matchers de jest-dom (setupFiles).
// Es un test CONDUCTUAL, no un tautológico: renderiza un componente
// real con estado y verifica su output tras interacción.

function Counter() {
  const [count, setCount] = useState(0)
  return (
    <div>
      <p>Contador: {count}</p>
      <button type="button" onClick={() => setCount(count + 1)}>
        Sumar
      </button>
    </div>
  )
}

describe('smoke — setup de testing (fase 0)', () => {
  it('renderiza con jsdom y matchers de jest-dom disponibles', () => {
    render(<Counter />)
    expect(screen.getByText('Contador: 0')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sumar' })).toBeEnabled()
  })

  it('la interacción actualiza el estado del componente', () => {
    render(<Counter />)
    fireEvent.click(screen.getByRole('button', { name: 'Sumar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sumar' }))
    expect(screen.getByText('Contador: 2')).toBeInTheDocument()
  })
})