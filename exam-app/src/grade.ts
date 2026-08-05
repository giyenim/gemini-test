import type { Answers, ExamData } from './types/exam'

export interface ExamScore {
  earned: number
  max: number
}

/** 제출 답안 채점 — 미선택·오답은 0점 */
export function gradeExam(exam: ExamData, answers: Answers): ExamScore {
  let earned = 0
  let max = 0

  for (const question of exam.questions) {
    max += question.points
    if (answers[question.id] === question.answer) {
      earned += question.points
    }
  }

  return { earned, max }
}
