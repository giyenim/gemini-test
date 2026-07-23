import type { ExamMeta } from '../types/exam'

interface SheetFooterProps {
  meta: ExamMeta
  pageNumber: number
}

export function SheetFooter({ meta, pageNumber }: SheetFooterProps) {
  return (
    <footer className="mt-2.5 grid shrink-0 grid-cols-[1fr_auto_1fr] items-center border-t border-line pt-1.5 font-serif text-[11px] text-ink">
      <span className="justify-self-start">
        {meta.year} {meta.title}
      </span>
      <span className="justify-self-center text-[13px] font-bold">{pageNumber}</span>
      <span className="justify-self-end">
        {meta.period} {meta.type}
      </span>
    </footer>
  )
}
