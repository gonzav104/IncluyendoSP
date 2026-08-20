import '@testing-library/jest-dom/vitest'

// jsdom no implementa scrollIntoView (Assistant lo usa para el auto-scroll)
Element.prototype.scrollIntoView = Element.prototype.scrollIntoView ?? (() => {})