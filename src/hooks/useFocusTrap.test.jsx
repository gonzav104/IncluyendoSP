import { fireEvent, render, screen } from '@testing-library/react'
import { useRef } from 'react'
import useFocusTrap from './useFocusTrap'

// FR-A11-1: al montar → scroll-lock (body overflow hidden) + foco al primer
// focusable; Tab/Shift+Tab ciclan dentro del contenedor; al desmontar →
// restaura overflow y el foco al elemento previo (el trigger).

function TrapFixture() {
  const ref = useRef(null)
  useFocusTrap(ref)
  return (
    <div ref={ref} data-testid="trap">
      <button type="button">Primero</button>
      <button type="button">Segundo</button>
      <button type="button">Tercero</button>
    </div>
  )
}

describe('useFocusTrap (FR-A11-1)', () => {
  it('al montar: scroll-lock en body + foco al primer focusable', () => {
    render(<TrapFixture />)

    expect(document.body.style.overflow).toBe('hidden')
    expect(screen.getByRole('button', { name: 'Primero' })).toHaveFocus()
  })

  it('Tab cicla hacia adelante y Shift+Tab hacia atrás', () => {
    render(<TrapFixture />)
    const primero = screen.getByRole('button', { name: 'Primero' })
    const segundo = screen.getByRole('button', { name: 'Segundo' })
    const tercero = screen.getByRole('button', { name: 'Tercero' })

    fireEvent.keyDown(primero, { key: 'Tab' })
    expect(segundo).toHaveFocus()

    fireEvent.keyDown(segundo, { key: 'Tab' })
    expect(tercero).toHaveFocus()

    // Del último vuelve al primero (ciclo)
    fireEvent.keyDown(tercero, { key: 'Tab' })
    expect(primero).toHaveFocus()

    // Del primero, Shift+Tab va al último (ciclo inverso)
    fireEvent.keyDown(primero, { key: 'Tab', shiftKey: true })
    expect(tercero).toHaveFocus()
  })

  it('al desmontar: restaura overflow y el foco al elemento previo', () => {
    const trigger = document.createElement('button')
    trigger.textContent = 'Abrir'
    document.body.appendChild(trigger)
    trigger.focus()

    const { unmount } = render(<TrapFixture />)
    expect(document.body.style.overflow).toBe('hidden')

    unmount()

    expect(document.body.style.overflow).toBe('')
    expect(document.activeElement).toBe(trigger)
    trigger.remove()
  })
})