import type { ReactNode } from 'react'

interface SheetContentProps {
  left: ReactNode
  right: ReactNode
}

export function SheetContent({ left, right }: SheetContentProps) {
  return (
    <main className="grid min-h-0 flex-1 grid-cols-[1fr_22px_1fr] overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden pr-1 text-[11.5px] leading-[1.48] break-keep break-words">
        {left}
      </div>
      <div className="w-px justify-self-center bg-line" aria-hidden />
      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden pl-1 text-[11.5px] leading-[1.48] break-keep break-words">
        {right}
      </div>
    </main>
  )
}
