import { useState } from 'react'
import type { QuestionResult } from '../../grade'
import { choiceMark } from '../question/ChoiceGroup'
import { Modal } from './Modal'

interface ScoreTablePopupProps {
  results: QuestionResult[]
  onClose: () => void
  /** 오답 칸을 누르면 오답노트로 **갈아끼운다** (겹쳐 띄우지 않는다) */
  onOpenWrongNote: (questionId: number) => void
}

/** 고르지 않은 답은 `—` — 찍어서 틀린 것과 못 푼 것을 구분한다 */
function answerMark(choice: QuestionResult['selected']) {
  return choice === null ? '—' : choiceMark(choice)
}

/**
 * 문항별 채점표 (RESULT-PAGE.md §3).
 *
 * 기존 정답표(AnswerKeyView)를 흡수했다. 정답표의 `문항 / 정답 / 배점`에
 * `내 답`과 `○✕`를 더한 것이라 상위 집합이다.
 *
 * 축소 ↔ 확대가 **같은 4열 그리드**를 유지하고 담기는 정보만 달라진다.
 * 자리를 미리 잡아 두면 확대가 레이아웃 변경이 아니라 줌처럼 느껴진다.
 */
export function ScoreTablePopup({ results, onClose, onOpenWrongNote }: ScoreTablePopupProps) {
  const [expanded, setExpanded] = useState(false)
  const wrongCount = results.filter((r) => !r.correct).length

  return (
    <Modal
      title="문항별 채점표"
      width={expanded ? 620 : 460}
      onClose={onClose}
      aside={
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="border border-line bg-white px-2.5 py-1 font-serif text-[12px] text-ink hover:bg-hover"
        >
          {expanded ? '축소' : '확대'}
        </button>
      }
    >
      <p className="m-0 mb-3 text-center font-serif text-[12.5px] text-ink-muted">
        {wrongCount > 0
          ? '붉은 칸을 누르면 그 문항의 오답노트로 넘어갑니다.'
          : '전 문항 정답입니다.'}
      </p>

      {/* 문항 수가 20이 아니어도 4열 고정, 행만 늘어난다. 모바일은 2열 */}
      <ul className="m-0 grid list-none grid-cols-2 gap-1.5 p-0 sm:grid-cols-4">
        {results.map((r) => {
          const cell = (
            <>
              <span className="font-serif text-[13px] font-semibold">{r.id}</span>
              <span
                className={`font-serif text-[15px] leading-none ${
                  r.correct ? 'text-correct' : 'text-wrong'
                }`}
              >
                {r.correct ? '○' : '✕'}
              </span>
            </>
          )

          const detail = expanded ? (
            <span className="mt-1 block font-serif text-[11.5px] leading-[1.5] text-ink-muted">
              내 {answerMark(r.selected)} · 정 {choiceMark(r.answer)}
              <br />
              {r.points}점
            </span>
          ) : null

          const body = (
            <>
              <span className="flex items-center justify-between gap-1">{cell}</span>
              {detail}
            </>
          )

          const base = `block w-full border px-2 py-1.5 text-left ${
            r.correct ? 'border-line bg-white' : 'border-wrong bg-[#fdf0ee]'
          }`

          return (
            <li key={r.id}>
              {r.correct ? (
                <div className={base}>{body}</div>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenWrongNote(r.id)}
                  className={`${base} hover:bg-[#f9e2de]`}
                  aria-label={`${r.id}번 오답노트 보기`}
                >
                  {body}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}
