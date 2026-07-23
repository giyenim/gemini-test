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
    <div className="flex flex-col gap-[0.85rem] border border-line bg-white p-4">
      <div>
        <div className="mb-[0.35rem] flex justify-between font-serif text-[0.8rem] font-medium">
          <span>
            {currentIndex + 1} / {total}
          </span>
          <span className="text-ink-muted">
            응답 {answeredCount}/{total}
          </span>
        </div>
        <div
          className="h-1 overflow-hidden bg-[#ddd]"
          role="progressbar"
          aria-valuenow={currentIndex + 1}
          aria-valuemin={1}
          aria-valuemax={total}
        >
          <div
            className="h-full bg-accent transition-[width] duration-250 ease-in-out"
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
        frameClassName="max-h-[36vh] overflow-auto"
      />

      <QuestionBlock
        question={question}
        selected={answers[question.id]}
        submitted={submitted}
        onSelect={(choice) => onSelect(question.id, choice)}
        compact
      />

      <nav
        className="flex items-center justify-between gap-2 border-t border-[#ccc] pt-2"
        aria-label="문항 이동"
      >
        <button
          type="button"
          className="min-w-[4.2rem] border border-line bg-white px-[0.85rem] py-[0.45rem] font-serif text-[0.82rem] font-medium"
          disabled={currentIndex === 0}
          onClick={() => onChangeIndex(currentIndex - 1)}
        >
          이전
        </button>
        <div className="flex flex-wrap justify-center gap-[0.35rem]" role="tablist" aria-label="문항 선택">
          {questions.map((q, i) => {
            const isCurrent = i === currentIndex
            const isAnswered = answers[q.id] != null
            return (
              <button
                key={q.id}
                type="button"
                className={`h-8 w-8 border border-line p-0 font-serif text-[0.78rem] font-semibold ${
                  isCurrent ? 'outline outline-2 outline-offset-1 outline-accent' : ''
                } ${isAnswered ? 'bg-selected' : 'bg-white'}`}
                role="tab"
                aria-selected={isCurrent}
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
          className="min-w-[4.2rem] border border-line bg-white px-[0.85rem] py-[0.45rem] font-serif text-[0.82rem] font-medium"
          disabled={currentIndex >= total - 1}
          onClick={() => onChangeIndex(currentIndex + 1)}
        >
          다음
        </button>
      </nav>
    </div>
  )
}
