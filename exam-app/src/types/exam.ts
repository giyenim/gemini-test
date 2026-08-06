export type ChoiceIndex = 1 | 2 | 3 | 4 | 5

export interface ExamMeta {
  title: string
  year: string
  period: string
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
  /** 지문에 묶인 문제만 지정. 없으면 단일 문제 */
  passageId?: string
  /** 발문 아래 콘텐츠 블록 (자료 / 보기 / 그림) — 순서대로 렌더 */
  blocks?: QuestionContentBlock[]
  /** @deprecated blocks의 type:'view' 사용 */
  box?: {
    title: string
    body: string
  }
}

/** 문제 안 콘텐츠 블록 — 자료(일반/표/그림) · 질문 문장 · 보기 */
export type QuestionContentBlock =
  | { type: 'view'; title: string; body: string }
  | { type: 'general'; body: string }
  /** 테두리 없는 문단 — 자료 뒤에 오는 질문 문장("이에 대한 설명으로 …") */
  | { type: 'text'; body: string }
  /** 자료 표 */
  | { type: 'table'; head?: string[]; rows: string[][] }
  | {
      type: 'figure'
      /** `public/figures/` 안의 파일명. 비어 있으면 자리만 확보한다 */
      srcs?: string[]
      /** 그림마다 붙는 라벨 — (가) (나) 등 */
      labels?: string[]
      /**
       * 여러 장을 세로로 쌓는다 (기본은 가로 나열).
       * 가로로 두면 각 그림이 단 폭의 절반까지밖에 못 커진다.
       */
      stack?: boolean
      /** 확보할 높이(px). 이미지 로드 전에도 패킹이 흔들리지 않도록 항상 지정 */
      height: number
      /** 그림이 아직 없을 때 자리에 표시할 안내 문구 */
      note?: string
    }

export interface ExamData {
  meta: ExamMeta
  passages: Passage[]
  questions: Question[]
}

export type Answers = Partial<Record<number, ChoiceIndex>>
