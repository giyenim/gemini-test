import type { ExamMeta } from '../types/exam'

/** 2장 이후 헤더 — 저작권 문구 + 페이지·형 */
export interface SheetHeaderContinuedProps {
  meta: ExamMeta
  pageNumber: number
}

export function SheetHeaderContinued({
  meta,
  pageNumber,
}: SheetHeaderContinuedProps) {
  return (
    <header className="mb-2 shrink-0">
      <p className="mb-1.5 text-center font-serif text-[11px] text-ink-muted">
        {meta.copyright}
      </p>
      <div className="flex items-center justify-between">
        <span className="font-serif text-[28px] font-bold leading-none">
          {pageNumber}
        </span>
        <span className="inline-flex items-center justify-center whitespace-nowrap rounded border border-line px-3 py-0.5 font-serif text-sm font-bold leading-none">
          {meta.type}
        </span>
      </div>
      <div className="mt-2 border-t-[1.15px] border-line" />
    </header>
  )
}
