import type { ExamMeta } from '../types/exam'

interface SheetFooterProps {
  meta: ExamMeta
  pageNumber: number
  totalPages: number
}

/** 수능형 푸터 — 가운데 페이지 박스(현재/전체) + 오른쪽 저작권 */
export function SheetFooter({ meta, pageNumber, totalPages }: SheetFooterProps) {
  return (
    <footer className="relative mt-2.5 flex h-10 shrink-0 items-center justify-center">
      {/* ========== 가운데: 페이지 번호 박스 ==========
          PDF 기준:
          - 박스 ≈ 50×22
          - 대각선: 우상단 → 좌하단 (/)
          - 현재 페이지: 왼쪽 위
          - 전체 페이지: 오른쪽 아래쪽
      */}
      <div className="relative h-[28px] w-[64px] border border-line">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden
        >
          <line
            x1="100%"
            y1="0"
            x2="0"
            y2="100%"
            stroke="#111"
            strokeWidth="1.15"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <span className="absolute top-[1px] left-[4px] font-serif text-[14px] font-semibold leading-none">
          {pageNumber}
        </span>
        <span className="absolute top-[11px] right-[4px] font-serif text-[14px] font-semibold leading-none">
          {totalPages}
        </span>
      </div>

      {/* ========== 오른쪽: 저작권 ========== */}
      <p className="absolute right-0 bottom-0 m-0 font-serif text-[10px] leading-none text-[#6b8cae]">
        {meta.copyright}
      </p>
    </footer>
  )
}
