/** 2장 이후 헤더 — 페이지 번호 */
export interface SheetHeaderContinuedProps {
  pageNumber: number
}

export function SheetHeaderContinued({ pageNumber }: SheetHeaderContinuedProps) {
  return (
    <header className="shrink-0">
      {/* 페이지 번호만 둔다 — 형(홀수형/짝수형) 구분이 없다 */}
      <div className="flex h-9 items-center">
        <span className="font-serif text-[36px] font-semibold leading-none">
          {pageNumber}
        </span>
      </div>
      <div className="mt-2 border-t-[1.15px] border-line" />
    </header>
  )
}
