import { useMemo, type ReactNode } from 'react'
import type { Answers, ChoiceIndex, ExamData, Passage, Question } from '../types/exam'
import { PassageBlock, QuestionBlock } from './QuestionBlock'
import { SheetContent } from './SheetContent'
import { SheetFooter } from './SheetFooter'
import { SheetHeader, type SheetHeaderKind } from './SheetHeader'

interface ExamSheetProps {
  exam: ExamData
  answers: Answers
  submitted: boolean
  onSelect: (questionId: number, choice: ChoiceIndex) => void
  pageIndex: number
}

interface SheetPage {
  number: number
  headerKind: SheetHeaderKind
  left: ReactNode
  right: ReactNode
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
    const qNodes = (qs: Question[]) =>
      qs.map((q) => (
        <QuestionContent
          key={q.id}
          question={q}
          selected={answers[q.id]}
          submitted={submitted}
          onSelect={(choice) => onSelect(q.id, choice)}
        />
      ))

    const built: SheetPage[] = [
      {
        number: 1,
        headerKind: 'first',
        left: passage ? <PassageContent passage={passage} /> : null,
        right: <>{qNodes(questions.slice(0, 2))}</>,
      },
      {
        number: 2,
        headerKind: 'continued',
        left: null,
        right: <>{qNodes(questions.slice(2))}</>,
      },
    ]
    return built
  }, [passages, questions, answers, submitted, onSelect])

  const page = pages[pageIndex] ?? pages[0]

  return (
    <div className="sheet-page" data-page={page.number}>
      <div className="sheet-page-inner">
        <SheetHeader
          kind={page.headerKind}
          meta={meta}
          pageNumber={page.number}
        />
        <SheetContent left={page.left} right={page.right} />
        <SheetFooter meta={meta} pageNumber={page.number} />
      </div>
    </div>
  )
}

export function getSheetPageCount(_exam: ExamData): number {
  return 2
}
