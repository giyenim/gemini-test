import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react'
import type { QuestionResult } from '../../grade'
import { columnWidth, PAGE_W } from '../../layout/constants'
import type { ExamData } from '../../types/exam'
import { IconButton, PaperWindow } from '../../ui'
import { choiceMark } from '../question/choiceMarks'
import { QuestionBlock } from '../question/QuestionBlock'
import { highlightTerms } from '../examText'
import { Modal } from './Modal'

/**
 * 문항 전문을 시험지와 같은 폭으로 보여 준다.
 * `QuestionBlock` 은 단 폭 기준으로 만들어졌으므로 이 폭을 벗어나면 조판이 흐트러진다.
 */
const QUESTION_W = columnWidth(PAGE_W)

/**
 * 문항을 이만큼 키워 보여 준다. 시험지는 11.5px 로 조판되어 있어 창에 그대로 옮기면
 * 작다 — 여기서는 한 문제만 들여다보는 자리라 키워도 조판이 흐트러지지 않는다.
 * `transform: scale` 이 아니라 `zoom` 인 것은 확대해도 획이 번지지 않아서다 (LAYOUT.md).
 *
 * 이 값은 **상한**이다. 좁은 화면에서는 창 폭에 맞춰 배율을 내린다 — 배율을 고정하면
 * 문항이 창보다 넓어져, nowrap 인 조합 선택지 다섯 칸이 서로 겹쳐 보인다.
 */
const NOTE_ZOOM = 1.4

/**
 * 스와이프로 인정하는 최소 가로 이동(px) — 모바일에서 장을 넘기는 유일한 길이다.
 * 세로로 더 많이 민 손짓은 본문 스크롤이므로 넘기지 않고, `preventDefault` 도 하지
 * 않는다 — 스크롤을 막으면 긴 해설을 읽다가 손이 걸린다.
 */
const SWIPE_MIN = 48

/**
 * 출처에서 쪽수 괄호만 뽑는다 — `02-1 (p.55)` 에서 `(p.55)`.
 * 절 번호는 책을 펴 든 사람에게만 쓸모가 있어 뺐다. 괄호가 없으면 있는 그대로 쓴다.
 */
function pageOf(detail: string): string {
  return detail.match(/\([^)]*\)/)?.[0] ?? detail
}

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
 * 창은 채점표와 같은 손그림 종이(`ui/PaperWindow`)다. 창의 글꼴은 킷 글꼴(Pretendard)이지만
 * **문항 전문만은 명조**로 감싼다 — 시험지에서 오려 붙인 조각이라 거기서 보던 그대로여야 한다.
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

  const last = wrong.length - 1
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

  const current = wrong[index] ?? null
  const question = current ? exam.questions.find((q) => q.id === current.id) : null

  // 확대 배율 = min(NOTE_ZOOM, 실제 폭 / 문항 폭). 배율을 바깥 폭에서 재는 것은
  // zoom 이 걸린 요소는 자기 좌표계로 측정돼 값이 순환하기 때문이다.
  const outerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(NOTE_ZOOM)
  useEffect(() => {
    const outer = outerRef.current
    if (!outer) return
    const fit = () => setZoom(Math.min(NOTE_ZOOM, outer.clientWidth / QUESTION_W))
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(outer)
    return () => ro.disconnect()
  }, [])

  /*
   * 스와이프 — 손을 뗄 때 한 번만 판단한다. 미는 도중에 장을 갈아 끼우면 손가락 아래
   * 글자가 바뀌어 읽던 자리를 잃는다.
   */
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0]
    touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null
  }
  const onTouchEnd = (event: TouchEvent) => {
    const start = touchStart.current
    const touch = event.changedTouches[0]
    touchStart.current = null
    if (!start || !touch) return

    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) <= Math.abs(dy)) return

    // 왼쪽으로 밀면 다음 장 — 종이를 손으로 밀어내는 방향이다 (시험지 스와이프와 같다)
    go(index + (dx < 0 ? 1 : -1))
  }

  return (
    <Modal
      title="오답노트"
      width={Math.round(QUESTION_W * NOTE_ZOOM) + 176}
      bare
      hideHeader
      bodyClassName="contents"
      onClose={onClose}
    >
      <PaperWindow
        title="오답노트"
        aside={`${index + 1} / ${wrong.length}`}
        /* 화살표는 PC 것이다 — 모바일은 손으로 밀어 넘긴다 (아래 `onTouchEnd`) */
        left={
          <span className="hidden md:block">
            <IconButton label="이전 오답" disabled={index === 0} onClick={() => go(index - 1)}>
              {/* 손그림 갈매기 — 서명 창의 ✕ 와 같은 획 굵기다 */}
              <path d="M15.4 5.2Q9.4 11.6 8.7 12Q9.5 12.5 15.2 19" />
            </IconButton>
          </span>
        }
        right={
          <span className="hidden md:block">
            <IconButton label="다음 오답" disabled={index === last} onClick={() => go(index + 1)}>
              <path d="M8.6 5.2Q14.6 11.6 15.3 12Q14.5 12.5 8.8 19" />
            </IconButton>
          </span>
        }
        onClose={onClose}
      >
        <div
          ref={outerRef}
          className="w-full"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
        <div className="mx-auto font-serif" style={{ width: QUESTION_W, zoom }}>
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
                <span className="mx-2 text-ink-muted">/</span>
                정답 <b className="text-correct">{choiceMark(current.answer)}</b>
              </p>

              {/*
                해설·출처는 `머리말)` 로 연다 — 어디부터 무엇인지 한 덩어리로 알린다.
                해설은 머리말이 **제 줄을 차지한다**(`block`) — 여러 줄짜리 해설(ㄱ/ㄴ/ㄷ)에서
                머리말을 첫 줄에 얹으면 ㄱ 만 안쪽으로 밀려 ㄴ·ㄷ 와 어긋난다.
                `</b>` 와 본문 사이 줄바꿈은 JSX 가 지우므로 `whitespace-pre-line` 이어도
                빈 줄이 생기지 않는다.
              */}
              {question.explanation ? (
                <p className="m-0 mt-2 font-serif text-[12.5px] leading-[1.65] whitespace-pre-line">
                  <b className="block font-semibold">해설)</b>
                  {question.explanation}
                </p>
              ) : null}

              {/*
                출처는 시험지 조각이 아니라 안내다 — 명조를 벗고 화면 글꼴을 쓴다.
                해설 바로 밑에 같은 크기·색으로 두면 **해설의 마지막 문단**으로 읽힌다.
                장 제목이 길어 두 줄로 넘어갈 때 특히 그렇다. 그래서 네 가지로 갈랐다 —
                간격(해설 문단 사이보다 넓게) · 크기(해설보다 작게) · 색(한 단계 더 물린 회색) ·
                `출처)` 머리말. 머리말은 두 글자지만 이것만으로 문장이 아님이 확정된다.
                한 줄짜리라 머리말을 굵히지 않고 뒤따르는 글과 같은 굵기로 둔다 —
                이미 색과 크기로 본문에서 물러나 있어 여기서 더 힘을 주면 도로 눈에 걸린다.
              */}
              {question.source ? (
                <p className="m-0 mt-5 font-ui text-[11.5px] leading-[1.5] text-source">
                  출처) {question.source.chapter} {pageOf(question.source.detail)}
                </p>
              ) : null}
            </>
          ) : null}
        </div>

          {/* 화살표가 없는 모바일에만 — 넘기는 길이 안 보이면 첫 장에서 멈춘다 */}
          {wrong.length > 1 ? (
            <p className="m-0 mt-6 text-center font-ui text-[11.5px] text-ink-muted md:hidden">
              좌우로 밀어서 넘기기
            </p>
          ) : null}
        </div>

      </PaperWindow>
    </Modal>
  )
}
