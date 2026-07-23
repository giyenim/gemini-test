import type { ExamMeta } from '../types/exam'

export interface SheetHeaderFirstProps {
  meta: ExamMeta
  pageNumber: number
}

export function SheetHeaderFirst({ meta, pageNumber }: SheetHeaderFirstProps) {
  return (
    // 헤더 전체 박스 — h-[120px] 가 헤더 높이
    <header className="relative mt-1 flex h-[120px] shrink-0 flex-col box-border">
      {/* ========== 페이지 번호 (예: 1) ==========
          - 위치: top / right
          - 크기: text-[36px]
      */}
      <span className="absolute top-0 right-0 z-10 font-serif text-[32px] font-semibold leading-none">
        {pageNumber}
      </span>

      {/* ========== 상단 줄: 시험명 ==========
          - 크기: text-[23px] / font-semibold / scale-x-90
      */}
      <div className="grid h-9 grid-cols-1 items-end pb-[3px]">
        <p className="m-0 justify-self-center scale-x-90 whitespace-nowrap font-serif text-[23px] font-semibold leading-[1.15] tracking-[-0.02em]">
          {meta.year} {meta.title}
        </p>
      </div>

      {/* ========== 하단 줄: 교시 | 과목 | 홀수형 (한 블럭, 위쪽 정렬) ========== */}
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_auto_1fr] items-start gap-x-2 pt-3 pb-3">
        {/* --- 왼쪽: 교시 타원 ---
            - 높이 h-[34px] / 글자 text-[25px] / scale-x-80 origin-left
        */}
        <div className="inline-flex h-[34px] origin-left scale-x-80 items-center justify-center justify-self-start whitespace-nowrap rounded-full border border-line px-3 font-serif text-[25px] font-bold leading-none">
          {meta.period}
        </div>

        {/* --- 가운데: 과목명 ---
            - 크기 text-[46px] / font-bold
        */}
        <h1 className="m-0 justify-self-center whitespace-nowrap font-serif text-[46px] font-bold leading-none tracking-[0.12em]">
          {meta.subject}
        </h1>

        {/* --- 오른쪽: 홀수형 뱃지 ---
            - 높이 h-12 / 글자 text-[30px] / scale-x-90 origin-right
        */}
        <div className="inline-flex h-12 origin-right scale-x-90 items-center justify-center justify-self-end whitespace-nowrap rounded border border-line px-3 font-serif text-[30px] font-bold leading-none">
          {meta.type}
        </div>
      </div>

      {/* ========== 하단 구분선 ========== */}
      <div className="shrink-0 border-t-[1.15px] border-line" />
    </header>
  )
}
