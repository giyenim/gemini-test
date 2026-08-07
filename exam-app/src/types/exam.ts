export type ChoiceIndex = 1 | 2 | 3 | 4 | 5

export interface ExamMeta {
  title: string
  year: string
  period: string
  subject: string
  copyright: string
  /** 발행처 — 표지 하단과 성적통지표 발급 기관에 같은 값이 들어간다 */
  publisher: string
}

export interface Passage {
  id: string
  label: string
  intro: string
  body: string
  questionIds: number[]
}

/** 오답노트에서 안내할 교재 위치 */
export interface QuestionSource {
  /** 장 — 예: `01장 안녕, 제미나이!` */
  chapter: string
  /** 절·쪽 — 예: `01-4 (p.43~44)` */
  detail: string
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
  /** 오답노트 해설 2~3줄. 줄바꿈으로 항목을 나눈다 */
  explanation?: string
  /** 오답노트 하단의 책 안내 */
  source?: QuestionSource
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

/** 응시자 — 시작 화면에서 이름만 받고 수험 번호는 응시 시각으로 발급한다 */
export interface Examinee {
  name: string
  /** 8자리. 시험지 헤더의 4-4 칸과 성적표에 같은 값이 찍힌다 */
  id: string
  /** 응시일 — 성적표 하단 날짜 */
  takenAt: string
}
