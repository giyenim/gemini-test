import type { ReactNode } from 'react'

export function highlightTerms(text: string): ReactNode[] {
  const parts = text.split(/(단순 관점)/g)
  return parts.map((part, i) =>
    part === '단순 관점' ? (
      <span
        key={i}
        className="mx-px inline whitespace-nowrap border border-line px-0.5 leading-[1.3]"
      >
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}
