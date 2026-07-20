export type ChoiceIndex = 1 | 2 | 3 | 4 | 5

export type ViewMode = 'sheet' | 'one'

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
  box?: {
    title: string
    body: string
  }
}

export interface ExamData {
  meta: ExamMeta
  passages: Passage[]
  questions: Question[]
}

export type Answers = Partial<Record<number, ChoiceIndex>>
