import { fireEvent, render, screen } from '@testing-library/react'
import InstitutionModal from './InstitutionModal'

// FR-A11-1: al abrir el modal → foco dentro + body sin scroll; Tab cicla
// dentro del diálogo; al cerrar → restaura scroll y foco al trigger.

const INSTITUTION = {
  id: 'i1',
  name: 'Centro de Salud',
  type: 'salud',
  specialties: ['neuropediatria'],
  age_range: { min: 0, max: 12 },
  address: { street: 'Calle 1', city: 'San Pedro' },
  contact: { phone: '123' },
  coverage: { cud: 'yes', accepted_plans: ['IOMA'] },
  accessibility: { rampa: true },
  services: [],
  verification: { status: 'verified' },
}

describe('InstitutionModal — focus trap (FR-A11-1)', () => {
  it('al abrir: foco dentro del modal y body sin scroll', () => {
    render(<InstitutionModal institution={INSTITUTION} onClose={() => {}} />)

    expect(document.body.style.overflow).toBe('hidden')
    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveFocus()
  })

  it('Tab cicla dentro del modal', () => {
    render(<InstitutionModal institution={INSTITUTION} onClose={() => {}} />)
    const cerrar = screen.getByRole('button', { name: 'Cerrar' })

    fireEvent.keyDown(cerrar, { key: 'Tab' })
    // Único focusable: el ciclo vuelve a Cerrar
    expect(cerrar).toHaveFocus()
  })

  it('al cerrar: restaura el scroll y el foco al trigger', () => {
    const trigger = document.createElement('button')
    trigger.textContent = 'Abrir'
    document.body.appendChild(trigger)
    trigger.focus()

    const { unmount } = render(<InstitutionModal institution={INSTITUTION} onClose={() => {}} />)
    unmount()

    expect(document.body.style.overflow).toBe('')
    expect(document.activeElement).toBe(trigger)
    trigger.remove()
  })
})