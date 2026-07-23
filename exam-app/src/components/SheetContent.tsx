import type { ReactNode } from 'react'

interface SheetContentProps {
  left: ReactNode
  right: ReactNode
}

export function SheetContent({ left, right }: SheetContentProps) {
  return (
    <main className="sheet-content sheet-columns">
      <div className="sheet-col sheet-col-left">{left}</div>
      <div className="sheet-gutter" aria-hidden />
      <div className="sheet-col sheet-col-right">{right}</div>
    </main>
  )
}
