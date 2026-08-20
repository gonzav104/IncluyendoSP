import { useEffect } from 'react'

// Focus trap para modales (FR-A11-1): scroll-lock en body, foco al primer
// focusable al montar, Tab/Shift+Tab ciclan dentro del contenedor y al
// desmontar restaura el overflow y el foco al elemento previo (el trigger).

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

export default function useFocusTrap(containerRef) {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const getFocusable = () => Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR))

    const first = getFocusable()[0]
    if (first) first.focus()
    else container.setAttribute('tabindex', '-1') && container.focus()

    const onKeyDown = (event) => {
      if (event.key !== 'Tab') return
      const items = getFocusable()
      if (items.length === 0) {
        event.preventDefault()
        return
      }
      // Trap total: el Tab SIEMPRE navega dentro del contenedor (con ciclo)
      const index = items.indexOf(document.activeElement)
      const step = event.shiftKey ? -1 : 1
      const next = index === -1 ? (event.shiftKey ? items[items.length - 1] : items[0]) : items[(index + step + items.length) % items.length]
      event.preventDefault()
      next.focus()
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
      previousFocus?.focus?.()
    }
  }, [containerRef])
}