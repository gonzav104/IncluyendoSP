import Markdown from 'react-markdown'

// Estilos compartidos para renderizar el Markdown que devuelve la IA
// dentro de las burbujas del chat, con el lenguaje visual calmo y médico.

export const markdownComponents = {
  p: ({ children }) => <p className="leading-relaxed">{children}</p>,
  h1: ({ children }) => (
    <h1 className="mb-1 mt-3 text-base font-extrabold text-slate-900 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-1 mt-3 text-base font-extrabold text-slate-900 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1 mt-2 text-sm font-extrabold text-slate-900 first:mt-0">{children}</h3>
  ),
  ul: ({ children }) => <ul className="ml-4 list-disc space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="ml-4 list-decimal space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="pl-1">{children}</li>,
  strong: ({ children }) => <strong className="font-extrabold text-slate-900">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-teal-700 underline decoration-2 underline-offset-2 hover:text-teal-800"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-4 border-teal-200 bg-teal-50/50 px-3 py-1.5">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-slate-700">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
      {children}
    </pre>
  ),
  hr: () => <hr className="my-3 border-t border-slate-200" />,
}

export function AssistantMarkdown({ children }) {
  return <Markdown components={markdownComponents}>{children}</Markdown>
}
