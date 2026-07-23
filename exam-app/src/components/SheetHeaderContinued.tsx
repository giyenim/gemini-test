import type { ExamMeta } from '../types/exam'

/** 2장 이후 헤더 — 페이지·형 */
export interface SheetHeaderContinuedProps {
  meta: ExamMeta
  pageNumber: number
}

export function SheetHeaderContinued({
  meta,
  pageNumber,
}: SheetHeaderContinuedProps) {
  return (
    <header className="shrink-0">
      <div className="flex items-center justify-between">
        <span className="font-serif text-[36px] font-semibold leading-none">
          {pageNumber}
        </span>
        {/* 홀수형 뱃지 — 첫 장과 동일 스타일, 축소 (h-12→h-8, text-30→20) */}
        <div className="inline-flex h-8 origin-right scale-x-90 items-center justify-center whitespace-nowrap rounded border border-line px-2.5 font-serif text-[20px] font-bold leading-none">
          {meta.type}
        </div>
      </div>
      <div className="mt-2 border-t-[1.15px] border-line" />
    </header>
  )
}
