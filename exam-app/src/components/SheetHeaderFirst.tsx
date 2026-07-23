import type { ExamMeta } from '../types/exam'

/** 첫 장 헤더 — 시험명·페이지 / 교시·과목·형 / 구분선 */
export interface SheetHeaderFirstProps {
  meta: ExamMeta
  pageNumber: number
}

export function SheetHeaderFirst({ meta, pageNumber }: SheetHeaderFirstProps) {
  return (
    <header className="sheet-header sheet-header-first">
      <div className="sheet-header-first-top">
        <p className="sheet-main-title">
          {meta.year} {meta.title}
        </p>
        <span className="sheet-page-num">{pageNumber}</span>
      </div>

      <div className="sheet-header-first-bottom">
        <div className="sheet-period-oval">{meta.period}</div>
        <h1 className="sheet-subject">{meta.subject}</h1>
        <div className="sheet-type-badge sheet-type-badge-lg">{meta.type}</div>
      </div>

      <div className="sheet-header-rule sheet-header-rule-bottom" />
    </header>
  )
}
