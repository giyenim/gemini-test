export type ChoiceIndex = 1 | 2 | 3 | 4 | 5

export interface ExamMeta {
  title: string
  year: string
  period: string
  type: string
  subject: string
  copyright: string
}

export interface Passage {
  id: string
  label: string
  intro: string
  body: string
  questionIds: number[]
}

export interface Question {
  id: number
  stem: string
  choices: [string, string, string, string, string]
  answer: ChoiceIndex
  points: number
  passageId: string
  /** 발문 아래 콘텐츠 블록 (보기 / 일반) — 순서대로 렌더 */
  blocks?: QuestionContentBlock[]
  /** @deprecated blocks의 type:'view' 사용 */
  box?: {
    title: string
    body: string
  }
}

/** 문제 안 콘텐츠 블록 — 보기 / 일반 (사진의 선생님 박스는 general) */
export type QuestionContentBlock =
  | { type: 'view'; title: string; body: string }
  | { type: 'general'; body: string }

export interface ExamData {
  meta: ExamMeta
  passages: Passage[]
  questions: Question[]
}

export type Answers = Partial<Record<number, ChoiceIndex>>
