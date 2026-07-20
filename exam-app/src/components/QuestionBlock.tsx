import type { ReactNode } from 'react'
import type { ChoiceIndex, Question } from '../types/exam'
import { ChoiceGroup } from './ChoiceGroup'

interface QuestionBlockProps {
  question: Question
  selected?: ChoiceIndex
  submitted: boolean
  onSelect: (choice: ChoiceIndex) => void
  compact?: boolean
  renderStem?: (stem: string) => ReactNode
}

export function QuestionBlock({
  question,
  selected,
  submitted,
  onSelect,
  compact,
  renderStem,
}: QuestionBlockProps) {
  const resultClass =
    submitted && selected != null
      ? selected === question.answer
        ? ' is-correct-q'
        : ' is-wrong-q'
      : ''

  return (
    <article
      id={`q-${question.id}`}
      className={`question-block${compact ? ' is-compact' : ''}${resultClass}`}
    >
      <h3 className="question-stem">
        <span className="question-num">{question.id}.</span>
        <span className="question-stem-text">
          {renderStem ? renderStem(question.stem) : question.stem}
          {question.points !== 2 && (
            <span className="question-points"> [{question.points}점]</span>
          )}
        </span>
      </h3>

      {question.box && (
        <aside className="view-box" aria-label={question.box.title}>
          <div className="view-box-title">&lt;{question.box.title}&gt;</div>
          <div className="view-box-body">
            {question.box.body.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </aside>
      )}

      <ChoiceGroup
        questionId={question.id}
        choices={question.choices}
        selected={selected}
        correctAnswer={question.answer}
        submitted={submitted}
        onSelect={onSelect}
      />
    </article>
  )
}

interface PassageBlockProps {
  label: string
  intro: string
  body: string
  collapsed?: boolean
  onToggle?: () => void
  renderBody?: (para: string) => ReactNode
}

export function PassageBlock({
  label,
  intro,
  body,
  collapsed,
  onToggle,
  renderBody,
}: PassageBlockProps) {
  return (
    <section className={`passage-block${collapsed ? ' is-collapsed' : ''}`}>
      <p className="passage-label">
        <strong>{label}</strong> {intro}
      </p>
      {onToggle && (
        <button type="button" className="passage-toggle" onClick={onToggle}>
          {collapsed ? '지문 펼치기' : '지문 접기'}
        </button>
      )}
      {!collapsed && (
        <div className="passage-frame">
          <div className="passage-body">
            {body.split('\n\n').map((para, i) => (
              <p key={i}>{renderBody ? renderBody(para) : para}</p>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
