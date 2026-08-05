/**
 * 일반 문제 (Question)
 *
 * 수능 과학탐구 문항 구성:
 *   ├─ 발문 (stem)              ← 자료를 소개하는 문장 ("다음은 … 설명이다.")
 *   ├─ 자료 블록                 ← optional  general / table / figure
 *   ├─ 질문 문장 (text)          ← optional  "이에 대한 설명으로 옳은 것만을 …"
 *   ├─ 보기 블록 (ViewBox)       ← optional  <보 기> 박스
 *   └─ 선택지 (ChoiceGroup)      ← 조합형은 가로 5등분, 서술형은 세로
 *
 * 배점 표시([3점])는 질문 문장이 있으면 그 끝에, 없으면 발문 끝에 붙는다.
 * 블록 사이 여백은 BLOCK_GAP 한 곳에서만 정한다 (레퍼런스 문제지 실측값).
 */
import type { ReactNode } from 'react'
import type { ChoiceIndex, Question, QuestionContentBlock } from '../../types/exam'
import { ChoiceGroup } from './ChoiceGroup.tsx'
import { FigureBlock } from './FigureBlock.tsx'
import { GeneralBlock } from './GeneralBlock.tsx'
import { TableBlock } from './TableBlock.tsx'
import { ViewBox } from './ViewBox.tsx'

/** 블록 아래 여백 (px) — 레퍼런스 문제지 실측 */
const BLOCK_GAP: Record<QuestionContentBlock['type'], number> = {
  general: 8,
  table: 8,
  figure: 12,
  text: 6,
  view: 14,
}

/** 발문 아래 여백 */
const STEM_GAP = 6

interface QuestionBlockProps {
  question: Question
  selected?: ChoiceIndex
  submitted: boolean
  onSelect: (choice: ChoiceIndex) => void
  renderStem?: (stem: string) => ReactNode
  /** 측정용 사본은 false — 같은 id가 문서에 두 번 생기지 않게 한다 */
  anchor?: boolean
}

function resolveBlocks(question: Question): QuestionContentBlock[] {
  if (question.blocks?.length) return question.blocks
  if (question.box) {
    return [{ type: 'view', title: question.box.title, body: question.box.body }]
  }
  return []
}

function PointMark({ points }: { points: number }) {
  if (points === 2) return null
  return <span className="font-medium"> [{points}점]</span>
}

function renderBlock(block: QuestionContentBlock): ReactNode {
  switch (block.type) {
    case 'view':
      return <ViewBox title={block.title} body={block.body} />
    case 'figure':
      return (
        <FigureBlock
          srcs={block.srcs}
          labels={block.labels}
          height={block.height}
          note={block.note}
        />
      )
    case 'table':
      return <TableBlock head={block.head} rows={block.rows} />
    default:
      return <GeneralBlock body={block.body} />
  }
}

export function QuestionBlock({
  question,
  selected,
  submitted,
  onSelect,
  renderStem,
  anchor = true,
}: QuestionBlockProps) {
  const blocks = resolveBlocks(question)
  const lastTextIndex = blocks.reduce(
    (acc, block, i) => (block.type === 'text' ? i : acc),
    -1,
  )

  return (
    <article id={anchor ? `q-${question.id}` : undefined}>
      {/* 발문 — 번호는 단 왼쪽 끝, 둘째 줄부터 번호 폭만큼 들여쓰기 */}
      <h3
        className="flex gap-1 text-[13px] font-bold leading-[1.35]"
        style={{ marginBottom: STEM_GAP }}
      >
        <span className="shrink-0">{question.id}.</span>
        <span className="break-keep">
          {renderStem ? renderStem(question.stem) : question.stem}
          {lastTextIndex < 0 && <PointMark points={question.points} />}
        </span>
      </h3>

      {/* 자료 → 질문 문장 → 보기 */}
      {blocks.map((block, i) => (
        <div key={i} style={{ marginBottom: BLOCK_GAP[block.type] }}>
          {block.type === 'text' ? (
            <p className="m-0 text-[11.5px] leading-[1.5] break-keep">
              {block.body}
              {i === lastTextIndex && <PointMark points={question.points} />}
            </p>
          ) : (
            renderBlock(block)
          )}
        </div>
      ))}

      <ChoiceGroup
        questionId={question.id}
        choices={question.choices}
        selected={selected}
        correctAnswer={question.answer}
        submitted={submitted}
        onSelect={(choice) => onSelect(choice)}
      />
    </article>
  )
}
