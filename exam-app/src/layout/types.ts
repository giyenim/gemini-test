export type PackedHeaderKind = 'first' | 'continued'

/** 지문 본문 한 조각 (단락 시작이면 indent) */
export interface PassageSegment {
  text: string
  indent: boolean
}

export interface PassageMeasure {
  id: string
  introHeight: number
  /** 테두리 박스 세로 크롬 (border + padding) — 측정 보정용 */
  boxChrome: number
  /** 인트로+박스 전체 실측 높이 */
  fullHeight: number
  paragraphs: string[]
  questionIds: number[]
}

/**
 * 시험지에 놓이는 순서 단위.
 * - `passage`  지문 + 그 지문에 딸린 문제들
 * - `questions` 지문 없는 단일 문제들의 연속 구간
 */
export type PackItem =
  | { kind: 'passage'; passage: PassageMeasure }
  | { kind: 'questions'; questionIds: number[] }

export interface PackInput {
  items: PackItem[]
  questionHeights: Map<number, number>
  /**
   * 목표 단 수. 주면 남은 문제를 남은 단에 고르게 나눠 담는다.
   * (수능 과탐처럼 쪽수가 고정된 시험지용. 높이가 모자라면 자동으로 넘어간다)
   */
  targetColumns?: number
  contentHeightFirst: number
  contentHeightContinued: number
  /**
   * 지문 조각 실측. 단 끝까지 채우기 위해 글자 단위 분할에 사용.
   * segments가 비고 showIntro만이면 인트로 높이.
   */
  measurePassage: (args: {
    passageId: string
    showIntro: boolean
    segments: PassageSegment[]
    openTop?: boolean
    openBottom?: boolean
  }) => number
}

export interface PlacedPassage {
  type: 'passage'
  passageId: string
  showIntro: boolean
  segments: PassageSegment[]
  openTop: boolean
  openBottom: boolean
  /** 같은 단에서 문제 뒤에 이어질 때 등 — 상단 여백 */
  gapBefore: number
}

export interface PlacedQuestion {
  type: 'question'
  questionId: number
  /** 이 문제 위쪽 간격 (단 시작은 COLUMN_TOP 패딩으로 이미 반영) */
  gapBefore: number
}

/** PC 마지막 단 — 제출/답지 보기 버튼 (마지막 문제와 함께 패킹) */
export interface PlacedSubmitAction {
  type: 'submit-action'
  gapBefore: number
}

export type PlacedItem = PlacedPassage | PlacedQuestion | PlacedSubmitAction

export interface PackedColumn {
  items: PlacedItem[]
}

export interface PackedPage {
  headerKind: PackedHeaderKind
  left: PackedColumn
  right: PackedColumn
}
