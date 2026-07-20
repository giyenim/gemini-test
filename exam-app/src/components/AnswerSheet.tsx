import type { Answers, ExamData } from '../types/exam'
import { choiceMark } from '../utils/choices'

interface AnswerSheetProps {
  exam: ExamData
  answers: Answers
  submitted: boolean
  onJump?: (questionId: number) => void
}

export function AnswerSheet({ exam, answers, submitted, onJump }: AnswerSheetProps) {
  return (
    <aside className="answer-sheet" aria-label="답안 현황">
      <h2 className="answer-sheet-title">답안 현황</h2>
      <ul className="answer-grid">
        {exam.questions.map((q) => {
          const selected = answers[q.id]
          let status = 'empty'
          if (selected != null) status = 'filled'
          if (submitted && selected != null) {
            status = selected === q.answer ? 'correct' : 'wrong'
          } else if (submitted && selected == null) {
            status = 'missed'
          }

          return (
            <li key={q.id}>
              <button
                type="button"
                className={`answer-cell is-${status}`}
                onClick={() => onJump?.(q.id)}
                title={
                  selected != null
                    ? `${q.id}번 ${choiceMark(selected)}`
                    : `${q.id}번 미응답`
                }
              >
                <span className="answer-num">{q.id}</span>
                <span className="answer-mark">
                  {selected != null ? choiceMark(selected) : '·'}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}

interface GradeBarProps {
  exam: ExamData
  answers: Answers
  submitted: boolean
  onSubmit: () => void
  onReset: () => void
}

export function GradeBar({
  exam,
  answers,
  submitted,
  onSubmit,
  onReset,
}: GradeBarProps) {
  const totalPoints = exam.questions.reduce((s, q) => s + q.points, 0)
  const scored = exam.questions.reduce((s, q) => {
    if (answers[q.id] === q.answer) return s + q.points
    return s
  }, 0)
  const correctCount = exam.questions.filter(
    (q) => answers[q.id] === q.answer,
  ).length
  const answered = exam.questions.filter((q) => answers[q.id] != null).length
  const allAnswered = answered === exam.questions.length

  return (
    <div className="grade-bar">
      {!submitted ? (
        <>
          <p className="grade-hint">
            {answered}/{exam.questions.length}문항 응답
            {!allAnswered && ' · 미응답 문항이 있습니다'}
          </p>
          <button type="button" className="grade-submit" onClick={onSubmit}>
            채점하기
          </button>
        </>
      ) : (
        <>
          <p className="grade-result">
            <strong>
              {scored}/{totalPoints}점
            </strong>
            <span>
              · 정답 {correctCount}/{exam.questions.length}문항
            </span>
          </p>
          <button type="button" className="grade-reset" onClick={onReset}>
            다시 풀기
          </button>
        </>
      )}
    </div>
  )
}
