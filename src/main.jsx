import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ChatProvider } from './context/ChatContext.jsx'

// ChatProvider va en main.jsx (design: "por separación de concerns"): el
// historial del chat sobrevive al switch de tabs (FR-CP-1) y App queda
// limpio. Sin este provider, useChat() tira error y desmonta TODO el árbol.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ChatProvider>
      <App />
    </ChatProvider>
  </StrictMode>,
)
