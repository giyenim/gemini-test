import { useCallback, useEffect, useState } from 'react'
import type { QuestionResult } from '../../grade'
import { columnWidth, PAGE_W } from '../../layout/constants'
import type { ExamData } from '../../types/exam'
import { choiceMark } from '../question/ChoiceGroup'
import { QuestionBlock } from '../question/QuestionBlock'
import { highlightTerms } from '../examText'
import { BOOK_URL } from './constants'
import { Modal } from './Modal'

/**
 * 문항 전문을 시험지와 같은 폭으로 보여 준다.
 * `QuestionBlock` 은 단 폭 기준으로 만들어졌으므로 이 폭을 벗어나면 조판이 흐트러진다.
 */
const QUESTION_W = columnWidth(PAGE_W)

interface WrongNotePopupProps {
  exam: ExamData
  wrong: QuestionResult[]
  /** 채점표에서 특정 문항을 눌러 들어온 경우 그 문항부터 편다 */
  startQuestionId?: number
  onClose: () => void
}

/**
 * 오답노트 (RESULT-PAGE.md §4) — **한 문제씩** 넘겨 본다. 목록으로 쌓지 않는다.
 *
 * 마지막 오답 다음에 한 장을 더 둔다. 넘기다 보면 자연스럽게 책 안내에 도착한다.
 */
export function WrongNotePopup({
  exam,
  wrong,
  startQuestionId,
  onClose,
}: WrongNotePopupProps) {
  const initial = Math.max(
    0,
    wrong.findIndex((w) => w.id === startQuestionId),
  )
  const [index, setIndex] = useState(initial)

  // 마지막 인덱스는 오답이 아니라 책 안내 장이다
  const ctaIndex = wrong.length
  const last = ctaIndex
  const go = useCallback(
    (next: number) => setIndex(Math.min(last, Math.max(0, next))),
    [last],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(index - 1)
      if (e.key === 'ArrowRight') go(index + 1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [index, go])

  const current = index < ctaIndex ? wrong[index] : null
  const question = current ? exam.questions.find((q) => q.id === current.id) : null

  // 틀린 문항이 걸쳐 있는 장 목록 — 책 안내에 그대로 쓴다
  const chapters = [
    ...new Set(
      wrong
        .map((w) => exam.questions.find((q) => q.id === w.id)?.source?.chapter)
        .filter((c): c is string => Boolean(c)),
    ),
  ]

  return (
    <Modal
      title="오답노트"
      width={QUESTION_W + 120}
      onClose={onClose}
      aside={index < ctaIndex ? `${index + 1} / ${wrong.length}` : '정리'}
    >
      <div className="mx-auto w-full" style={{ maxWidth: QUESTION_W }}>
        {question && current ? (
          <>
            <QuestionBlock
              question={question}
              selected={current.selected ?? undefined}
              submitted
              onSelect={() => {}}
              renderText={(text) => <>{highlightTerms(text)}</>}
              anchor={false}
            />

            <p className="m-0 mt-4 border-t border-line pt-3 font-serif text-[12.5px]">
              내 답 <b>{current.selected === null ? '—' : choiceMark(current.selected)}</b>
              <span className="mx-2 text-ink-muted">·</span>
              정답 <b className="text-correct">{choiceMark(current.answer)}</b>
            </p>

            {question.explanation ? (
              <p className="m-0 mt-2 font-serif text-[12.5px] leading-[1.65] whitespace-pre-line">
                {question.explanation}
              </p>
            ) : null}

            {question.source ? (
              <p className="m-0 mt-3 font-serif text-[12px] leading-[1.5] text-ink-muted">
                📖 {question.source.chapter}
                <br />
                <span className="text-[11.5px]">{question.source.detail}</span>
              </p>
            ) : null}
          </>
        ) : (
          /* 마지막 장 — 넘기다 보면 도착하는 자리. 가장 잘 눌리는 곳이다 */
          <div className="py-6 text-center font-serif">
            {wrong.length > 0 ? (
              <>
                <p className="m-0 text-[15px] font-bold">
                  {wrong.length}문항을 틀렸습니다.
                </p>
                {chapters.length > 0 ? (
                  <p className="m-0 mt-3 text-[12.5px] leading-[1.7] text-ink-muted">
                    이 내용은 책의 다음 장에 있습니다.
                    <br />
                    {chapters.map((c) => (
                      <span key={c} className="mt-1 block text-ink">
                        {c}
                      </span>
                    ))}
                  </p>
                ) : null}
              </>
            ) : (
              /* 만점자 — 지금은 오답노트 링크가 죽어 있어 여기까지 오지 않지만 분기는 남겨 둔다 */
              <p className="m-0 text-[15px] font-bold">
                이미 이 책의 독자시군요 — 주변에 추천해 주세요.
              </p>
            )}

            <a
              href={BOOK_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-block border border-accent bg-accent px-5 py-2.5 text-[13px] font-semibold text-white no-underline hover:opacity-90"
            >
              📖 책에서 확인하기
            </a>
          </div>
        )}
      </div>

      {/* 인디케이터는 점이 아니라 틀린 문항 번호 — 바로 점프할 수 있다 */}
      <nav className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-3">
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          className="shrink-0 border-0 bg-transparent px-1 font-serif text-[12.5px] whitespace-nowrap text-ink disabled:opacity-30"
        >
          ‹ 이전
        </button>

        <div className="flex min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-1">
          {wrong.map((w, i) => (
            <button
              key={w.id}
              type="button"
              onClick={() => go(i)}
              aria-current={i === index}
              className={`border-0 bg-transparent px-0.5 font-serif text-[12.5px] ${
                i === index ? 'font-bold text-wrong underline' : 'text-ink-muted'
              }`}
            >
              {w.id}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index === last}
          className="shrink-0 border-0 bg-transparent px-1 font-serif text-[12.5px] whitespace-nowrap text-ink disabled:opacity-30"
        >
          다음 ›
        </button>
      </nav>
    </Modal>
  )
}
