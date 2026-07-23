import type { ExamMeta } from '../types/exam'

export interface SheetHeaderFirstProps {
  meta: ExamMeta
  pageNumber: number
}

export function SheetHeaderFirst({ meta, pageNumber }: SheetHeaderFirstProps) {
  return (
    // 헤더 전체 박스 — h-[120px] 가 헤더 높이
    <header className="relative flex h-[120px] shrink-0 flex-col box-border mt-1">
      {/* ========== 페이지 번호 (예: 1) ==========
          - 위치: top / right 숫자만 바꾸면 됨 (예: top-1 right-2, top-[6px] right-[4px])
          - 크기: text-[36px]
          - 굵기: font-semibold
      */}
      <span className="absolute top-0 right-0 z-10 font-serif text-[36px] font-semibold leading-none">
        {pageNumber}
      </span>

      {/* ========== 홀수형/짝수형 뱃지 ==========
          - 위치: bottom / right 로 조절 (구분선 위에 두고 싶으면 bottom-3 등)
          - 박스 높이: h-11
          - 글자 크기: text-[26px]
          - 홀쭉하게: scale-x-90
      */}
      <div className="absolute right-0 bottom-3.5 z-10 inline-flex h-12 origin-right scale-x-90 items-center justify-center whitespace-nowrap rounded border border-line px-3 font-serif text-[30px] font-bold leading-none">
        {meta.type}
      </div>

      {/* ========== 상단 줄: 시험명 (예: 2026학년도 대학수학능력시험 문제지) ==========
          - 크기: text-[23px]
          - 굵기: font-semibold
          - 홀쭉하게: scale-x-90 (1에 가까울수록 원래 비율)
          - 줄 높이 영역: 바깥 div 의 h-9
      */}
      <div className="grid h-9 grid-cols-1 items-end pb-[3px]">
        <p className="m-0 justify-self-center whitespace-nowrap font-serif text-[23px] font-semibold leading-[1.15] tracking-[-0.02em] scale-x-90">
          {meta.year} {meta.title}
        </p>
      </div>

      {/* ========== 하단 줄: 왼쪽 교시 / 가운데 과목 ========== */}
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_auto_1fr] items-center pt-1 pb-[20px]">
        {/* --- 왼쪽: 교시 타원 (예: 제 1 교시) ---
            - 박스 높이: h-[31px]
            - 글자 크기: text-[20px]
        */}
        <div className="inline-flex h-[34px] origin-left scale-x-80 items-center justify-center justify-self-start whitespace-nowrap rounded-full border border-line px-3 font-serif text-[25px] font-bold leading-none">
          {meta.period}
        </div>

        {/* --- 가운데: 과목명 (예: 국어 영역) ---
            - 크기: text-[46px]
            - 굵기: font-bold
            - 자간: tracking-[0.12em]
        */}
        <h1 className="m-0 justify-self-center whitespace-nowrap font-serif text-[46px] font-bold leading-none tracking-[0.12em]">
          {meta.subject}
        </h1>
      </div>

      {/* ========== 하단 구분선 ==========
          - 두께: border-t-[1.15px]
      */}
      <div className="shrink-0 border-t-[1.15px] border-line" />
    </header>
  )
}
