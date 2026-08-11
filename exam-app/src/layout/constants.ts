/** PDF 기준 페이지 크기 (App.tsx SHEET_ZOOM과 동일 기준) */
export const PAGE_W = 842
export const PAGE_H = 1191

/** 단 시작(지문·문제 공통) 상단 여백 */
export const COLUMN_TOP = 14

/**
 * 단 끝 하단 여백 — `COLUMN_TOP` 의 짝.
 *
 * 단이 꽉 차면 마지막 선택지가 푸터의 `mt-2.5` 만 남기고 붙어 버려 숨이 막힌다.
 * 위와 같은 값을 아래에도 줘서 단이 위아래로 같은 여백을 갖게 한다.
 *
 * `SheetColumn` 의 `paddingBottom` 과 `packSheet` 의 `colHeight` 가 **함께** 본다.
 * 패딩만 주고 패킹에서 빼지 않으면 마지막 문제가 그 위로 밀려 나가 잘린다
 * (페이지가 `overflow-hidden` 이라 조용히 사라진다).
 *
 * 키울수록 한 단에 담기는 양이 줄어 쪽수(`TARGET_PAGES`)가 흔들릴 수 있다.
 */
export const COLUMN_BOTTOM = 14

/**
 * 시험지 목표 쪽수 — 수능 과학탐구 문제지는 항상 4쪽(2단 × 8단)이다.
 * 패킹은 이 쪽수에 맞춰 단마다 문제를 고르게 나눠 담는다.
 */
export const TARGET_PAGES = 4
export const TARGET_COLUMNS = TARGET_PAGES * 2

/**
 * 문제 사이 간격 — 레퍼런스 문제지(과학탐구) 실측 70~90px.
 * 최소값보다 좁아지면 문제 수를 줄이거나 다음 단으로 넘긴다.
 * 남는 세로는 문제 사이에 균등 분배하되 최대값을 넘기지 않고,
 * 넘는 만큼은 단 아래 여백으로 남는다 (수능 문제지의 실제 모습).
 */
export const MIN_QUESTION_GAP = 56
export const MAX_QUESTION_GAP = 96

/**
 * 문제 다음 지문(같은 단) 사이 고정 여백 (= 문제 사이 최소 간격).
 * 지문 이어짐(open-top) 조각에는 쓰지 않음.
 */
export const QUESTION_TO_PASSAGE_GAP = MIN_QUESTION_GAP

/** 한 단에 들어갈 수 있는 최대 문제 수 */
export const MAX_QUESTIONS_PER_COLUMN = 3

/**
 * PC 마지막 문제 아래 제출/답지 블록 높이 (패킹 예약용)
 * gap(mt-6) + 점수줄 + 버튼
 */
export const SUBMIT_ACTION_GAP = 24
export const SUBMIT_ACTION_H = 64
export const SUBMIT_ACTION_BLOCK = SUBMIT_ACTION_GAP + SUBMIT_ACTION_H

/** 페이지 외곽 패딩 (ExamSheet) — 수능 문제지의 좁은 상하 여백 */
export const PAGE_PAD_TOP = 76
export const PAGE_PAD_BOTTOM = 50

/** 첫 장 헤더: mt-1 + h-[148px] (시험명 / 교시·과목 / 성명·수험 번호) */
export const HEADER_FIRST_H = 4 + 148

/** 속지 헤더: 페이지행(36) + mt-2 + 구분선 */
export const HEADER_CONTINUED_H = 36 + 8 + 1.15

/** 푸터: mt-2.5 + h-10 — `components/SheetFooter.tsx` 의 클래스와 같이 움직인다 */
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
