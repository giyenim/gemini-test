/** PDF 기준 페이지 크기 (App.tsx SHEET_ZOOM과 동일 기준) */
export const PAGE_W = 842
export const PAGE_H = 1191

/** 단 시작(지문·문제 공통) 상단 여백 */
export const COLUMN_TOP = 14

/** 문제 사이 최소 간격 — 이보다 작으면 다음 단으로 */
export const MIN_QUESTION_GAP = 14

/** 한 단에 들어갈 수 있는 최대 문제 수 */
export const MAX_QUESTIONS_PER_COLUMN = 3

/** 페이지 외곽 패딩 (ExamSheet) */
export const PAGE_PAD_TOP = 88
export const PAGE_PAD_BOTTOM = 60

/** 첫 장 헤더: mt-1 + h-[120px] */
export const HEADER_FIRST_H = 4 + 120

/** 속지 헤더: 페이지행(36) + mt-2 + 구분선 */
export const HEADER_CONTINUED_H = 36 + 8 + 1.15

/** 푸터: mt-2.5 + h-10 */
export const FOOTER_H = 10 + 40

/** 단 사이 세로 구분 영역 너비 */
export const COLUMN_GUTTER = 22

/** 페이지 좌우 패딩 */
export const PAGE_PAD_X = 88

/** SheetContent 단 안쪽 padding (pr-1 / pl-1) */
export const COLUMN_INNER_PAD = 4

export function columnWidth(pageWidth: number): number {
  const inner = pageWidth - PAGE_PAD_X * 2
  return (inner - COLUMN_GUTTER) / 2 - COLUMN_INNER_PAD
}

export function contentHeight(kind: 'first' | 'continued'): number {
  const header = kind === 'first' ? HEADER_FIRST_H : HEADER_CONTINUED_H
  return PAGE_H - PAGE_PAD_TOP - PAGE_PAD_BOTTOM - header - FOOTER_H
}
