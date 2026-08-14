import type { Examinee, ExamMeta } from '../types/exam'
import { SignatureMark } from './SignaturePad'

export interface SheetHeaderFirstProps {
  meta: ExamMeta
  pageNumber: number
  /** 응시자 — 성명·수험 번호 기입란을 채운다 */
  examinee?: Examinee | null
}

/**
 * 수험 번호 칸 — 레퍼런스 실측(`레퍼런스/01 물리학Ⅰ_문제.pdf` 1쪽) 그대로.
 * 라벨 72.3 / 숫자 4칸(각 20.7) / 하이픈 20.7 / 숫자 4칸 = 258.6
 */
const ID_CELL_W = 20.7

/** 수험 번호 4칸. `digits`가 없으면 빈칸으로 둔다 */
function DigitCells({ digits }: { digits?: string }) {
  return (
    <div className="flex">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={`flex h-full items-center justify-center font-write text-[13px] leading-none ${
            i < 3 ? 'border-r border-dashed border-line' : ''
          }`}
          style={{ width: ID_CELL_W }}
        >
          {digits?.[i] ?? ''}
        </span>
      ))}
    </div>
  )
}

export function SheetHeaderFirst({ meta, pageNumber, examinee }: SheetHeaderFirstProps) {
  return (
    // h-[148px] 가 헤더 높이 — constants.ts 의 HEADER_FIRST_H 와 함께 고친다
    <header className="relative mt-1 flex h-[148px] shrink-0 flex-col box-border">
      {/* 페이지 번호 */}
      <span className="absolute top-0 right-0 z-10 font-serif text-[32px] font-semibold leading-none">
        {pageNumber}
      </span>

      {/* 첫째 줄: 시험명 */}
      <div className="grid h-9 grid-cols-1 items-end pb-[3px]">
        <p className="m-0 justify-self-center scale-x-90 whitespace-nowrap font-gothic text-[23px] font-semibold leading-[1.15] tracking-[-0.02em]">
          {meta.year} {meta.title}
        </p>
      </div>

      {/* 둘째 줄: 교시 타원 | 과목명 */}
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_auto_1fr] items-start gap-x-2 pt-3 pb-2">
        <div className="inline-flex h-[34px] origin-left scale-x-80 items-center justify-center justify-self-start whitespace-nowrap rounded-full border border-line px-3 font-serif text-[25px] font-bold leading-none">
          {meta.period}
        </div>

        <h1 className="m-0 justify-self-center whitespace-nowrap font-gothic text-[46px] font-bold leading-none tracking-[0.12em]">
          {meta.subject}
        </h1>
      </div>

      {/*
        셋째 줄: 성명·수험 번호 기입란 — 레퍼런스 실측 (박스 26.5 / 성명 186.1 /
        사이 15.3 / 수험 번호 258.6). `제( )선택` 칸은 쓰지 않는다 (선택 과목이 없다).
      */}
      <div
        className="flex shrink-0 items-stretch justify-center font-gothic text-[15px] leading-none"
        style={{ height: 26.5, gap: 15.3 }}
      >
        <div className="flex border border-line" style={{ width: 186.1 }}>
          <span
            className="flex items-center justify-center border-r border-line"
            style={{ width: 38.5 }}
          >
            성명
          </span>
          <span className="flex min-w-0 flex-1 items-center justify-center px-1.5 py-0.5">
            <SignatureMark src={examinee?.signature} className="max-h-full w-full object-contain" />
          </span>
        </div>

        <div className="flex border border-line" style={{ width: 258.6 }}>
          <span
            className="flex items-center justify-center border-r border-line whitespace-nowrap"
            style={{ width: 72.3 }}
          >
            수험 번호
          </span>
          <DigitCells digits={examinee?.id.slice(0, 4)} />
          {/* 자리 구분 하이픈 */}
          <span
            className="flex items-center justify-center border-x border-line text-[13px]"
            style={{ width: ID_CELL_W }}
          >
            —
          </span>
          <DigitCells digits={examinee?.id.slice(4, 8)} />
        </div>
      </div>

      <div className="mt-2 shrink-0 border-t-[1.15px] border-line" />
    </header>
  )
}
