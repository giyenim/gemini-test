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
  renderStem,
}: QuestionBlockProps) {
  return (
    <article id={`q-${question.id}`} className="mb-2.5 last:mb-0">
      <h3 className="mb-1 flex gap-0.5 text-[11.5px] font-bold leading-[1.45]">
        <span className="shrink-0">{question.id}.</span>
        <span>
          {renderStem ? renderStem(question.stem) : question.stem}
          {question.points !== 2 && (
            <span className="font-medium"> [{question.points}점]</span>
          )}
        </span>
      </h3>

      {question.box && (
        <aside
          className="mb-1.5 border-[1.25px] border-line bg-white"
          aria-label={question.box.title}
        >
          <div className="border-b border-line p-0.5 text-center text-[11px] font-bold tracking-[0.4em]">
            &lt;{question.box.title}&gt;
          </div>
          <div className="px-2 py-1.5 text-[11px] font-normal leading-[1.45]">
            {question.box.body.split('\n\n').map((para, i) => (
              <p key={i} className="mb-[0.5em] whitespace-pre-wrap last:mb-0">
                {para}
              </p>
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
  frameClassName?: string
}

export function PassageBlock({
  label,
  intro,
  body,
  collapsed,
  onToggle,
  renderBody,
  frameClassName = '',
}: PassageBlockProps) {
  return (
    <section>
      <p className="mb-1.5 text-[11.5px] font-normal">
        <strong className="font-bold">{label}</strong> {intro}
      </p>
      {onToggle && (
        <button
          type="button"
          className="mb-1.5 inline-block border border-[#999] bg-white px-1.5 py-0.5 font-serif text-[0.72rem]"
          onClick={onToggle}
        >
          {collapsed ? '지문 펼치기' : '지문 접기'}
        </button>
      )}
      {!collapsed && (
        <div className={`border-[1.25px] border-line px-2.5 py-2 ${frameClassName}`}>
          <div className="text-justify text-[11.5px] leading-normal">
            {body.split('\n\n').map((para, i) => (
              <p key={i} className="mb-[0.5em] indent-[1em] last:mb-0">
                {renderBody ? renderBody(para) : para}
              </p>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
