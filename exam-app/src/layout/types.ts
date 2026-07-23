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

export interface PackInput {
  passages: PassageMeasure[]
  questionHeights: Map<number, number>
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

export type PlacedItem = PlacedPassage | PlacedQuestion

export interface PackedColumn {
  items: PlacedItem[]
}

export interface PackedPage {
  headerKind: PackedHeaderKind
  left: PackedColumn
  right: PackedColumn
}
