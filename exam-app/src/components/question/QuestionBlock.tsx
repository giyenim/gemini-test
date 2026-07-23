/**
 * 일반 문제 (Question)
 *
 * 지문 (Passage) 과 형제:
 *   ├─ 발문 (stem)           ← 항상
 *   ├─ 보기 블록 (ViewBox)   ← optional  <보기> 제목 박스
 *   ├─ 일반 블록 (GeneralBlock) ← optional  테두리 본문 (선생님 설명 등)
 *   └─ 선택지 (ChoiceGroup)  ← 거의 항상
 */
import type { ReactNode } from 'react'
import type { ChoiceIndex, Question, QuestionContentBlock } from '../../types/exam'
import { ChoiceGroup } from './ChoiceGroup.tsx'
import { GeneralBlock } from './GeneralBlock.tsx'
import { ViewBox } from './ViewBox.tsx'

interface QuestionBlockProps {
  question: Question
  selected?: ChoiceIndex
  submitted: boolean
  onSelect: (choice: ChoiceIndex) => void
  renderStem?: (stem: string) => ReactNode
}

function resolveBlocks(question: Question): QuestionContentBlock[] {
  if (question.blocks?.length) return question.blocks
  if (question.box) {
    return [{ type: 'view', title: question.box.title, body: question.box.body }]
  }
  return []
}

export function QuestionBlock({
  question,
  selected,
  submitted,
  onSelect,
  renderStem,
}: QuestionBlockProps) {
  const blocks = resolveBlocks(question)

  return (
    <article id={`q-${question.id}`}>
      {/* 발문 (stem) — 항상 */}
      <h3 className="mb-1 flex gap-0.5 text-[11.5px] font-bold leading-[1.45]">
        <span className="shrink-0">{question.id}.</span>
        <span>
          {renderStem ? renderStem(question.stem) : question.stem}
          {question.points !== 2 && (
            <span className="font-medium"> [{question.points}점]</span>
          )}
        </span>
      </h3>

      {/* blocks 배열 순서대로: 보기 / 일반 */}
      {blocks.map((block, i) =>
        block.type === 'view' ? (
          <ViewBox key={i} title={block.title} body={block.body} />
        ) : (
          <GeneralBlock key={i} body={block.body} />
        ),
      )}

      {/* 선택지 (ChoiceGroup) */}
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
