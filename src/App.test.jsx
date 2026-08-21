import { act, fireEvent, render, screen } from '@testing-library/react'
import App from './App'

// D19 + FR-PF-4: el directorio local-first mantiene status 'success' aunque
// el remoto falle — el banner amber debe estar condicionado a `error`, NO a
// status. El botón Reintentar queda con spinner mientras recarga: el hook real
// (fix del verify-report) setea status 'loading' en load() SIN limpiar el
// error previo hasta que el remoto responde — el estado mockeado abajo es
// alcanzable (D19 implementado en useInstitutions.js).
// FR-PF-1 (T-18): InstitutionModal y Assistant van lazy con Suspense fallback.

const { useInstitutionsMock, modalMock, assistantMock, lazyBlock } = vi.hoisted(() => ({
  useInstitutionsMock: vi.fn(),
  modalMock: vi.fn(),
  assistantMock: vi.fn(),
  lazyBlock: new Promise(() => {}), // nunca resuelve → simula chunk pendiente
}))

vi.mock('./hooks/useInstitutions', () => ({
  default: () => useInstitutionsMock(),
}))

vi.mock('./components/InstitutionModal', () => ({
  default: () => modalMock(),
}))

vi.mock('./components/Assistant', () => ({
  default: () => assistantMock(),
}))

const INST = {
  id: 'x',
  name: 'Institución local',
  type: 'salud',
  coverage: { cud: 'no', accepted_plans: [] },
  contact: { phone: '123' },
  verification: { status: 'unknown' },
  specialties: [],
  address: { street: 'Calle', city: 'San Pedro' },
  age_range: null,
  accessibility: {},
}

const baseMock = {
  institutions: [],
  status: 'success',
  error: null,
  isLocal: true,
  load: vi.fn(),
}

describe('App — banner amber local-first (D19)', () => {
  beforeEach(() => {
    useInstitutionsMock.mockReturnValue(baseMock)
    modalMock.mockImplementation(() => <div>Modal mock</div>)
    assistantMock.mockImplementation(() => <div>Assistant mock</div>)
  })
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('muestra el banner amber cuando el remoto falló (error seteado)', () => {
    useInstitutionsMock.mockReturnValue({ ...baseMock, error: 'network down' })
    render(<App />)

    expect(screen.getByText(/No se pudo conectar con la API/)).toBeInTheDocument()
    expect(screen.getByText(/mostrando datos locales de respaldo/)).toBeInTheDocument()
  })

  it('sin error no hay banner amber', () => {
    render(<App />)

    expect(screen.queryByText(/No se pudo conectar con la API/)).not.toBeInTheDocument()
  })

  it('Reintentar queda con spinner y deshabilitado mientras recarga (loading)', () => {
    // Estado REAL del hook (D19): load() setea 'loading' y el error previo
    // persiste hasta que el remoto responde → banner + botón con spinner.
    useInstitutionsMock.mockReturnValue({
      ...baseMock,
      institutions: [{ id: 'x', name: 'Institución local' }],
      error: 'x',
      status: 'loading',
    })
    render(<App />)

    const button = screen.getByRole('button', { name: 'Reintentar' })
    expect(button).toBeDisabled()
    expect(button.querySelector('svg').getAttribute('class')).toContain('animate-spin')
  })

  it('Reintentar dispara load()', () => {
    const load = vi.fn()
    useInstitutionsMock.mockReturnValue({ ...baseMock, error: 'x', load })
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(load).toHaveBeenCalled()
  })
})

describe('App — code-split lazy (FR-PF-1, T-18)', () => {
  beforeEach(() => {
    useInstitutionsMock.mockReturnValue({ ...baseMock, institutions: [INST] })
    modalMock.mockImplementation(() => <div>Modal mock</div>)
    assistantMock.mockImplementation(() => <div>Assistant mock</div>)
  })
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('modal: fallback spinner teal mientras el chunk lazy no resuelve', async () => {
    modalMock.mockImplementation(() => {
      throw lazyBlock
    })
    render(<App />)

    await act(async () => {
      fireEvent.click(screen.getByText('Institución local'))
    })

    const fallback = screen.getByRole('status')
    expect(fallback).toHaveAttribute('aria-label', 'Cargando')
    expect(fallback.getAttribute('class')).toContain('teal')
    expect(fallback.getAttribute('class')).toContain('animate-spin')
  })

  it('modal: contenido renderiza cuando el chunk resuelve', () => {
    render(<App />)

    fireEvent.click(screen.getByText('Institución local'))
    expect(screen.getByText('Modal mock')).toBeInTheDocument()
  })

  it('asistente: fallback spinner teal mientras el chunk lazy no resuelve', async () => {
    assistantMock.mockImplementation(() => {
      throw lazyBlock
    })
    render(<App />)

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Asistente IA' }))
    })

    const fallback = screen.getByRole('status')
    expect(fallback).toHaveAttribute('aria-label', 'Cargando')
    expect(fallback.getAttribute('class')).toContain('teal')
    expect(fallback.getAttribute('class')).toContain('animate-spin')
  })

  it('asistente: contenido renderiza cuando el chunk resuelve', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('tab', { name: 'Asistente IA' }))
    expect(screen.getByText('Assistant mock')).toBeInTheDocument()
  })
})