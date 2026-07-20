import { useMemo, useState } from 'react'
import type { Answers, ExamData, ChoiceIndex } from '../types/exam'
import { PassageBlock, QuestionBlock } from './QuestionBlock'

interface OneByOneProps {
  exam: ExamData
  answers: Answers
  submitted: boolean
  onSelect: (questionId: number, choice: ChoiceIndex) => void
  currentIndex: number
  onChangeIndex: (index: number) => void
}

export function OneByOne({
  exam,
  answers,
  submitted,
  onSelect,
  currentIndex,
  onChangeIndex,
}: OneByOneProps) {
  const questions = exam.questions
  const question = questions[currentIndex]
  const passage = useMemo(
    () => exam.passages.find((p) => p.id === question?.passageId),
    [exam.passages, question?.passageId],
  )
  const [passageCollapsed, setPassageCollapsed] = useState(false)

  if (!question || !passage) return null

  const total = questions.length
  const answeredCount = questions.filter((q) => answers[q.id] != null).length

  return (
    <div className="one-by-one">
      <div className="one-progress">
        <div className="one-progress-text">
          <span>
            {currentIndex + 1} / {total}
          </span>
          <span className="one-answered">응답 {answeredCount}/{total}</span>
        </div>
        <div
          className="one-progress-bar"
          role="progressbar"
          aria-valuenow={currentIndex + 1}
          aria-valuemin={1}
          aria-valuemax={total}
        >
          <div
            className="one-progress-fill"
            style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <PassageBlock
        label={passage.label}
        intro={passage.intro}
        body={passage.body}
        collapsed={passageCollapsed}
        onToggle={() => setPassageCollapsed((v) => !v)}
      />

      <QuestionBlock
        question={question}
        selected={answers[question.id]}
        submitted={submitted}
        onSelect={(choice) => onSelect(question.id, choice)}
        compact
      />

      <nav className="one-nav" aria-label="문항 이동">
        <button
          type="button"
          className="one-nav-btn"
          disabled={currentIndex === 0}
          onClick={() => onChangeIndex(currentIndex - 1)}
        >
          이전
        </button>
        <div className="one-dots" role="tablist" aria-label="문항 선택">
          {questions.map((q, i) => {
            let cls = 'one-dot'
            if (i === currentIndex) cls += ' is-current'
            if (answers[q.id] != null) cls += ' is-answered'
            if (submitted) {
              if (answers[q.id] === q.answer) cls += ' is-correct'
              else if (answers[q.id] != null) cls += ' is-wrong'
            }
            return (
              <button
                key={q.id}
                type="button"
                className={cls}
                role="tab"
                aria-selected={i === currentIndex}
                aria-label={`${q.id}번`}
                onClick={() => onChangeIndex(i)}
              >
                {q.id}
              </button>
            )
          })}
        </div>
        <button
          type="button"
          className="one-nav-btn"
          disabled={currentIndex >= total - 1}
          onClick={() => onChangeIndex(currentIndex + 1)}
        >
          다음
        </button>
      </nav>
    </div>
  )
}
