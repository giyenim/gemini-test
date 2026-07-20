import { useMemo, type ReactNode } from 'react'
import type { Answers, ChoiceIndex, ExamData, Passage, Question } from '../types/exam'
import { PassageBlock, QuestionBlock } from './QuestionBlock'

interface ExamSheetProps {
  exam: ExamData
  answers: Answers
  submitted: boolean
  onSelect: (questionId: number, choice: ChoiceIndex) => void
  pageIndex: number
}

interface SheetPage {
  number: number
  left: ReactNode
  right: ReactNode
  isFirst: boolean
}

function highlightTerms(text: string): ReactNode[] {
  const parts = text.split(/(단순 관점)/g)
  return parts.map((part, i) =>
    part === '단순 관점' ? (
      <span key={i} className="term-box">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

function PassageContent({ passage }: { passage: Passage }) {
  return (
    <PassageBlock
      label={passage.label}
      intro={passage.intro}
      body={passage.body}
      renderBody={(para) => <>{highlightTerms(para)}</>}
    />
  )
}

function QuestionContent({
  question,
  selected,
  submitted,
  onSelect,
}: {
  question: Question
  selected?: ChoiceIndex
  submitted: boolean
  onSelect: (choice: ChoiceIndex) => void
}) {
  return (
    <QuestionBlock
      question={question}
      selected={selected}
      submitted={submitted}
      onSelect={onSelect}
      renderStem={(stem) => <>{highlightTerms(stem)}</>}
    />
  )
}

export function ExamSheet({
  exam,
  answers,
  submitted,
  onSelect,
  pageIndex,
}: ExamSheetProps) {
  const { meta, passages, questions } = exam

  const pages = useMemo(() => {
    const passage = passages[0]
    const built: SheetPage[] = [
      {
        number: 1,
        isFirst: true,
        left: passage ? <PassageContent passage={passage} /> : null,
        right: (
          <>
            {questions.map((q) => (
              <QuestionContent
                key={q.id}
                question={q}
                selected={answers[q.id]}
                submitted={submitted}
                onSelect={(choice) => onSelect(q.id, choice)}
              />
            ))}
          </>
        ),
      },
    ]
    return built
  }, [passages, questions, answers, submitted, onSelect])

  const page = pages[pageIndex] ?? pages[0]

  return (
    <div className="sheet-page" data-page={page.number}>
      <div className="sheet-page-inner">
        {page.isFirst ? (
          <header className="sheet-header sheet-header-first">
            <div className="sheet-header-top">
              <div className="sheet-period-oval">{meta.period}</div>
              <div className="sheet-header-center">
                <p className="sheet-main-title">
                  {meta.year} {meta.title}
                </p>
                <h1 className="sheet-subject">{meta.subject}</h1>
              </div>
              <div className="sheet-header-right">
                <span className="sheet-page-num">{page.number}</span>
                <span className="sheet-type-badge">{meta.type}</span>
              </div>
            </div>
            <div className="sheet-header-rule" />
          </header>
        ) : (
          <header className="sheet-header sheet-header-cont">
            <p className="sheet-copyright">{meta.copyright}</p>
            <div className="sheet-cont-row">
              <span className="sheet-page-num">{page.number}</span>
              <span className="sheet-type-badge">{meta.type}</span>
            </div>
            <div className="sheet-header-rule" />
          </header>
        )}

        <div className="sheet-columns">
          <div className="sheet-col sheet-col-left">{page.left}</div>
          <div className="sheet-gutter" aria-hidden />
          <div className="sheet-col sheet-col-right">{page.right}</div>
        </div>

        <footer className="sheet-footer">
          <span>
            {meta.year} {meta.title}
          </span>
          <span className="sheet-footer-page">{page.number}</span>
          <span>
            {meta.period} {meta.type}
          </span>
        </footer>
      </div>
    </div>
  )
}

export function getSheetPageCount(_exam: ExamData): number {
  return 1
}
