import type { ExamMeta } from '../types/exam'

interface SheetFooterProps {
  meta: ExamMeta
  pageNumber: number
}

export function SheetFooter({ meta, pageNumber }: SheetFooterProps) {
  return (
    <footer className="sheet-footer">
      <span>
        {meta.year} {meta.title}
      </span>
      <span className="sheet-footer-page">{pageNumber}</span>
      <span>
        {meta.period} {meta.type}
      </span>
    </footer>
  )
}
