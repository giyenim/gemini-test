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
    <header className="sheet-header sheet-header-continued">
      <p className="sheet-copyright">{meta.copyright}</p>
      <div className="sheet-cont-row">
        <span className="sheet-page-num">{pageNumber}</span>
        <span className="sheet-type-badge">{meta.type}</span>
      </div>
      <div className="sheet-header-rule" />
    </header>
  )
}
