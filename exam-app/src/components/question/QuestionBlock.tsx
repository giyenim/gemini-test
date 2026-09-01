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

/** 블록 아래 여백 (px) — 발문·자료·질문 문장·보기 사이 */
const BLOCK_GAP: Record<QuestionContentBlock['type'], number> = {
  general: 11,
  table: 11,
  figure: 15,
  text: 9,
  view: 17,
}

/**
 * 선택지 바로 위 여백 — 마지막 블록에만 쓴다.
 * 문제 안(발문·자료·보기) 간격만 넓히고 선택지와의 간격은 그대로 둔다.
 */
const CHOICE_GAP: Record<QuestionContentBlock['type'], number> = {
  general: 8,
  table: 8,
  figure: 12,
  text: 6,
  view: 14,
}

/** 발문 아래 여백 */
const STEM_GAP = 9
/** 자료·보기 없이 선택지가 바로 붙는 문제의 발문 아래 여백 */
const STEM_TO_CHOICE_GAP = 6

/**
 * 들여쓰기 — 레퍼런스 문제지(`레퍼런스/01 물리학Ⅰ_문제.pdf`) 실측.
 * 단 왼쪽 87.9 기준으로
 *   문항 번호 87.9 · 발문 첫 줄 글자 106.7 · 발문 둘째 줄부터 99.2
 *   질문 문장 첫 줄 109.5 · 보기 박스 99.0 · 선택지 99.3
 * → 본문은 모두 11.3 들여쓰고, 번호만 그 왼쪽으로 내민다.
 */
export const BODY_INDENT = 11.3
/** 발문 첫 줄에서 번호와 글자 사이 */
const NUMBER_GAP = 7.8
/** 질문 문장 첫 줄만 한 글자 더 (109.5 − 99.2) */
const SENTENCE_INDENT = 10.3

interface QuestionBlockProps {
  question: Question
  selected?: ChoiceIndex
  submitted: boolean
  onSelect: (choice: ChoiceIndex) => void
  /** 발문·질문 문장에 표시 규칙(부정어 밑줄 등)을 입힌다 — `examText.highlightTerms` */
  renderText?: (text: string) => ReactNode
  /** 측정용 사본은 false — 같은 id가 문서에 두 번 생기지 않게 한다 */
  anchor?: boolean
}

function resolveBlocks(question: Question): QuestionContentBlock[] {
  return question.blocks ?? []
}

function PointMark({ points }: { points: number }) {
  if (points === 2) return null
  return <span> [{points}점]</span>
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
          stack={block.stack}
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
  renderText,
  anchor = true,
}: QuestionBlockProps) {
  const blocks = resolveBlocks(question)
  const lastTextIndex = blocks.reduce(
    (acc, block, i) => (block.type === 'text' ? i : acc),
    -1,
  )

  return (
    // 본문은 BODY_INDENT 만큼 들여쓴다 — 자료·보기 박스와 선택지까지 같은 기준선
    <article
      id={anchor ? `q-${question.id}` : undefined}
      style={{ paddingLeft: BODY_INDENT }}
    >
      {/*
        발문 — 번호만 단 왼쪽 끝으로 내밀고, 둘째 줄부터 본문 기준선으로 돌아온다.
        레퍼런스는 번호만 굵은 명조 13.0이고 발문 글자는 본문과 같은 중명조 11.2다.
      */}
      <h3
        className="m-0 text-[11.5px] font-normal leading-[1.5]"
        style={{
          marginLeft: -BODY_INDENT,
          paddingLeft: BODY_INDENT,
          textIndent: -BODY_INDENT,
          marginBottom: blocks.length ? STEM_GAP : STEM_TO_CHOICE_GAP,
        }}
      >
        <span
          className="text-[13px] font-bold leading-none"
          style={{ marginRight: NUMBER_GAP }}
        >
          {question.id}.
        </span>
        {renderText ? renderText(question.stem) : question.stem}
        {lastTextIndex < 0 && <PointMark points={question.points} />}
      </h3>

      {/* 자료 → 질문 문장 → 보기 */}
      {blocks.map((block, i) => (
        <div
          key={i}
          style={{
            marginBottom:
              (i === blocks.length - 1 ? CHOICE_GAP : BLOCK_GAP)[block.type],
          }}
        >
          {block.type === 'text' ? (
            /* 질문 문장 — 첫 줄만 한 글자 들여쓴다 */
            <p
              className="m-0 text-[11.5px] leading-[1.5]"
              style={{ textIndent: SENTENCE_INDENT }}
            >
              {renderText ? renderText(block.body) : block.body}
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
