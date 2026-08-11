import { useEffect, useRef, useState } from 'react'
import { HEADER_FIRST_H, PAGE_H, PAGE_PAD_X, PAGE_W } from '../layout/constants'
import type {
  Answers,
  ChoiceIndex,
  ExamData,
  Examinee,
  ExamMeta,
  Passage,
  Question,
} from '../types/exam'
import { CoverSheet } from './CoverSheet'
import { ExamActionButton } from './ExamActionButton'
import { PassageBlock } from './question/PassageBlock'
import { QuestionBlock } from './question/QuestionBlock'
import { SheetHeaderContinued } from './SheetHeaderContinued'
import { SheetHeaderFirst } from './SheetHeaderFirst'
import { highlightTerms } from './examText'

/** PC 시험지 헤더 콘텐츠 폭 — 모바일에선 이 폭 기준으로 비율 축소 */
const HEADER_DESIGN_W = PAGE_W - PAGE_PAD_X * 2

interface MobileExamViewProps {
  exam: ExamData
  answers: Answers
  examinee: Examinee | null
  onSelect: (questionId: number, choice: ChoiceIndex) => void
  onSubmit: () => void
  /** 표지 성명 칸에 적은 이름 — 속지 헤더·성적표까지 따라간다 */
  onSignatureChange: (dataUrl: string | null) => void
}

/** PC 1페이지 헤더와 동일 컴포넌트, 화면 폭에 맞게 scale */
function MobileSheetHeader({
  meta,
  pageNumber,
  examinee,
}: {
  meta: ExamMeta
  pageNumber: number
  examinee?: Examinee | null
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = hostRef.current
    if (!el) return

    const update = (width: number) => {
      setScale(Math.min(1, width / HEADER_DESIGN_W))
    }

    update(el.clientWidth)
    const ro = new ResizeObserver(([entry]) => {
      update(entry.contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      ref={hostRef}
      className="mb-4"
      style={{ height: HEADER_FIRST_H * scale }}
    >
      <div
        style={{
          width: HEADER_DESIGN_W,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <SheetHeaderFirst meta={meta} pageNumber={pageNumber} examinee={examinee} />
      </div>
    </div>
  )
}

/**
 * 표지 — 842×1191 고정 디자인이라 화면 폭에 맞춰 통째로 줄인다.
 * (`MobileSheetHeader` 와 같은 방식. 표지는 읽기만 하므로 축소해도 조작에 지장이 없다.)
 *
 * 배율은 밖에서 받는다. 문제 쪽도 이 배율로 종이 높이를 잡으므로 **한 곳에서 재야**
 * 장을 넘길 때 종이 크기가 어긋나지 않는다 (`MobileExamView` 의 `sheetScale`).
 */
function MobileCover({
  meta,
  examinee,
  scale,
  onSignatureChange,
}: {
  meta: ExamMeta
  examinee?: Examinee | null
  scale: number
  onSignatureChange: (dataUrl: string | null) => void
}) {
  return (
    <div style={{ height: PAGE_H * scale }}>
      <div style={{ width: PAGE_W, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <CoverSheet meta={meta} examinee={examinee} onSignatureChange={onSignatureChange} />
      </div>
    </div>
  )
}

interface MobilePagePassageGroup {
  type: 'passage-group'
  key: string
  passage: Passage
  questions: Question[]
}

interface MobilePageQuestionOnly {
  type: 'question'
  key: string
  question: Question
}

type MobilePage = MobilePagePassageGroup | MobilePageQuestionOnly

/**
 * 모바일 페이지 단위
 * - 지문에 묶인 문제들 → 한 페이지
 * - 단일(지문 없는) 문제 → 문제당 한 페이지
 * - 문제 배열 순서를 따라가며 묶음이 끊기지 않게 배치
 */
function buildMobilePages(exam: ExamData): MobilePage[] {
  const questionsById = new Map(exam.questions.map((question) => [question.id, question]))
  const passageByQuestionId = new Map<number, Passage>()

  for (const passage of exam.passages) {
    for (const questionId of passage.questionIds) {
      passageByQuestionId.set(questionId, passage)
    }
  }

  const usedPassageIds = new Set<string>()
  const usedQuestionIds = new Set<number>()
  const pages: MobilePage[] = []

  for (const question of exam.questions) {
    if (usedQuestionIds.has(question.id)) continue

    const passage = passageByQuestionId.get(question.id)
    if (passage) {
      if (usedPassageIds.has(passage.id)) continue
      usedPassageIds.add(passage.id)

      const questions = passage.questionIds
        .map((questionId) => questionsById.get(questionId))
        .filter((q): q is Question => q != null)

      questions.forEach((q) => usedQuestionIds.add(q.id))

      pages.push({
        type: 'passage-group',
        key: `passage:${passage.id}`,
        passage,
        questions,
      })
      continue
    }

    usedQuestionIds.add(question.id)
    pages.push({
      type: 'question',
      key: `question:${question.id}`,
      question,
    })
  }

  for (const passage of exam.passages) {
    if (usedPassageIds.has(passage.id)) continue
    pages.push({
      type: 'passage-group',
      key: `passage:${passage.id}`,
      passage,
      questions: [],
    })
  }

  return pages
}

function MobilePageContent({
  page,
  answers,
  onSelect,
}: {
  page: MobilePage
  answers: Answers
  onSelect: (questionId: number, choice: ChoiceIndex) => void
}) {
  if (page.type === 'passage-group') {
    return (
      <section>
        <PassageBlock
          label={page.passage.label}
          intro={page.passage.intro}
          segments={page.passage.body
            .split('\n\n')
            .filter(Boolean)
            .map((text) => ({ text, indent: true }))}
          renderBody={(para) => <>{highlightTerms(para)}</>}
        />

        {page.questions.length > 0 && (
          <div className="mt-4 flex flex-col gap-6">
            {page.questions.map((question) => (
              <QuestionBlock
                key={question.id}
                question={question}
                selected={answers[question.id]}
                submitted={false}
                onSelect={(choice) => onSelect(question.id, choice)}
                renderText={(text) => <>{highlightTerms(text)}</>}
              />
            ))}
          </div>
        )}
      </section>
    )
  }

  return (
    <section>
      <QuestionBlock
        question={page.question}
        selected={answers[page.question.id]}
        submitted={false}
        onSelect={(choice) => onSelect(page.question.id, choice)}
        renderText={(text) => <>{highlightTerms(text)}</>}
      />
    </section>
  )
}

export function MobileExamView({
  exam,
  answers,
  examinee,
  onSelect,
  onSubmit,
  onSignatureChange,
}: MobileExamViewProps) {
  const pages = buildMobilePages(exam)
  // 표지에 서명하기 전에는 문제 페이지를 붙이지 않는다 (아래 렌더 참고)
  const signed = Boolean(examinee?.signature)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    scrollLeft: number
    axis: 'none' | 'x' | 'y'
  } | null>(null)
  const [dragging, setDragging] = useState(false)

  /*
   * 종이 한 장의 배율 — 표지(842×1191)를 화면 폭에 맞춘 값이다.
   *
   * 스크롤러에서 **한 번만** 재서 표지와 문제 쪽이 같이 쓴다. 장마다 따로 재면
   * 값이 미세하게 갈려 넘길 때 종이가 들썩인다.
   *
   * 첫 렌더에 0 이면 종이가 납작하게 한 번 그려지므로 창 폭으로 어림잡아 시작한다
   * — 스크롤러가 화면 폭을 그대로 쓰므로 대개 맞고, 어긋나도 곧 실측으로 덮인다.
   */
  const [sheetScale, setSheetScale] = useState(() =>
    typeof window === 'undefined' ? 1 : Math.min(1, window.innerWidth / PAGE_W),
  )
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const update = () => setSheetScale(Math.min(1, el.clientWidth / PAGE_W))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  /** 종이 한 장의 세로 — 표지가 차지하는 높이. 문제 쪽은 이걸 **최소** 높이로 쓴다 */
  const sheetH = PAGE_H * sheetScale

  const endDrag = (pointerId: number) => {
    const drag = dragRef.current
    const el = scrollerRef.current
    if (!drag || drag.pointerId !== pointerId) return

    if (el && drag.axis === 'x') {
      const width = el.clientWidth
      if (width > 0) {
        const index = Math.round(el.scrollLeft / width)
        el.scrollTo({
          left: Math.max(0, Math.min(pages.length - 1, index)) * width,
          behavior: 'smooth',
        })
      }
      if (el.hasPointerCapture(pointerId)) {
        el.releasePointerCapture(pointerId)
      }
    }

    dragRef.current = null
    setDragging(false)
  }

  return (
    <div className="h-full overflow-hidden bg-white text-ink">
      {/* 가로 스와이프 · 마우스 드래그 · 스크롤로 페이지 전환 */}
      <div
        ref={scrollerRef}
        className={
          dragging
            ? 'flex h-full cursor-grabbing snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'
            : 'flex h-full cursor-grab snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'
        }
        onPointerDown={(event) => {
          if (event.pointerType !== 'mouse' || event.button !== 0) return
          const target = event.target as HTMLElement
          if (target.closest('button, a, input, label, textarea, select, [role="button"]')) {
            return
          }
          /*
           * 표지와 서명 창에서는 드래그를 시작하지 않는다.
           *
           * 서명 창은 `createPortal` 로 `body` 에 붙지만 **리액트 이벤트는 DOM 이 아니라
           * 컴포넌트 트리를 타고 올라온다.** 그래서 창 안에서 누른 것이 표지를 거쳐 여기까지
           * 닿았고, 8px 넘게 그으면 아래에서 `setPointerCapture` 로 포인터를 가져가
           * 캔버스가 획을 잃었다. 이름이 안 써지던 것이 이것이다.
           *
           * 표지는 읽고 서명하는 장이라 끌 일이 없다. 넘기는 손짓(터치)은 위의
           * `pointerType` 검사에서 이미 빠져 브라우저의 스냅 스크롤이 그대로 맡는다.
           */
          if (target.closest('[aria-label="표지"], [role="dialog"]')) {
            return
          }

          const el = scrollerRef.current
          if (!el) return
          dragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            scrollLeft: el.scrollLeft,
            axis: 'none',
          }
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current
          const el = scrollerRef.current
          if (!drag || !el || drag.pointerId !== event.pointerId) return

          const dx = event.clientX - drag.startX
          const dy = event.clientY - drag.startY

          if (drag.axis === 'none') {
            if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
            drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
            if (drag.axis === 'x') {
              el.setPointerCapture(event.pointerId)
              setDragging(true)
            }
          }

          if (drag.axis !== 'x') return

          event.preventDefault()
          el.scrollLeft = drag.scrollLeft - dx
        }}
        onPointerUp={(event) => endDrag(event.pointerId)}
        onPointerCancel={(event) => endDrag(event.pointerId)}
      >
        {/* 표지 — 문제 페이지 앞의 한 장. 쪽 번호를 받지 않는다 */}
        <article
          className="h-full w-full shrink-0 snap-start snap-always overflow-y-auto overscroll-y-contain bg-white"
          aria-label="표지"
        >
          {/*
            안내 문구를 따로 두지 않는다 — 표지가 열리면 서명 창이 바로 떠서
            (`SignaturePad` 의 `SignatureField`) 무엇을 해야 하는지가 화면 그 자체다.
            글로 한 번 더 이르면 종이 위에 군더더기가 얹힌다.

            표지는 폭에 맞춰 통째로 줄어들어(`MobileCover`) 세로가 화면보다 짧게 남는다.
            남는 자리를 위아래로 나눠 갖게 세로 가운데에 둔다 — 문제 페이지는 위에서부터
            읽어 내려야 하므로 **표지에만** 준다.

            `justify-center` 를 스크롤 상자에 바로 걸지 않고 `min-h-full` 을 두른 안쪽
            상자에 거는 이유: 화면이 표지보다 짧으면 가운데 정렬이 위쪽을 잘라 먹고
            스크롤로도 닿지 못한다. 안쪽 상자는 표지가 커지면 같이 늘어나 나눠 줄 여백이
            없어지므로, 그때는 자연히 위에서부터 그려진다.
          */}
          <div className="flex min-h-full flex-col justify-center">
            <MobileCover
              meta={exam.meta}
              examinee={examinee}
              scale={sheetScale}
              onSignatureChange={onSignatureChange}
            />
          </div>
        </article>

        {/*
          서명 전에는 문제 페이지를 아예 붙이지 않는다. 넘김이 스크롤 스냅이라
          "넘어가려는 동작"을 중간에 되돌리는 것보다 넘어갈 곳을 두지 않는 편이 조용하다.
        */}
        {signed &&
          pages.map((page, index) => {
          const pageNumber = index + 1
          const isLast = index === pages.length - 1
          return (
            <article
              key={page.key}
              className="h-full w-full shrink-0 snap-start snap-always overflow-y-auto overscroll-y-contain bg-white text-[11.5px] leading-[1.48] break-words"
              aria-label={`${pageNumber} / ${pages.length} 페이지`}
            >
              {/*
                문제 쪽도 표지와 **같은 크기의 종이** 위에 올린다. 바깥은 표지와 똑같이
                세로 가운데로 두고(`min-h-full` + `justify-center`), 안쪽 종이는
                표지 높이(`sheetH`)를 최소값으로 갖는다. 그래야 장을 넘겨도 종이의
                크기와 위아래 여백이 그대로 있어 화면이 들썩이지 않는다.

                `minHeight` 이지 `height` 가 아니다 — 문제가 길면 종이가 늘어나고,
                그때는 나눠 줄 여백이 없어져 위에서부터 그려진다 (표지와 같은 규칙).
                flex-1 은 그 안에서 풋터를 종이 맨 아래로 밀어 준다.
              */}
              <div className="flex min-h-full flex-col justify-center">
                <div className="flex flex-col px-4 py-6" style={{ minHeight: sheetH }}>
                  {index === 0 ? (
                    <MobileSheetHeader
                      meta={exam.meta}
                      pageNumber={pageNumber}
                      examinee={examinee}
                    />
                  ) : (
                    <div className="mb-4">
                      <SheetHeaderContinued pageNumber={pageNumber} />
                    </div>
                  )}

                  <div className="min-h-0 flex-1">
                    <MobilePageContent
                      page={page}
                      answers={answers}
                      onSelect={onSelect}
                    />

                    {isLast ? (
                      <div className="mt-8 flex flex-col items-center gap-3">
                        <ExamActionButton onClick={onSubmit}>제출</ExamActionButton>
                      </div>
                    ) : null}
                  </div>

                  <footer className="mt-8 shrink-0">
                    {/*
                      저작권은 쪽 번호 **위 줄**에 둔다. PC 시험지처럼 오른쪽 끝에 붙이면
                      좁은 화면에서는 가운데의 쪽 번호 상자와 겹친다 (425px 에서 이미 겹쳤다).
                      한 줄을 통째로 쓰니 잘라낼 일도 없어 `truncate` 도 뗐다.
                    */}
                    <p className="m-0 mb-1.5 text-center font-serif text-[8px] leading-none text-[#6b8cae]">
                      {exam.meta.copyright}
                    </p>
                    <div className="flex h-7 items-center justify-center">
                      <div className="relative h-[28px] w-[64px] border border-line">
                        <svg
                          className="pointer-events-none absolute inset-0 h-full w-full"
                          aria-hidden
                        >
                          <line
                            x1="100%"
                            y1="0"
                            x2="0"
                            y2="100%"
                            stroke="#111"
                            strokeWidth="1.15"
                            vectorEffect="non-scaling-stroke"
                          />
                        </svg>
                        <span className="absolute top-[1px] left-[4px] font-serif text-[14px] font-semibold leading-none">
                          {pageNumber}
                        </span>
                        <span className="absolute top-[11px] right-[4px] font-serif text-[14px] font-semibold leading-none">
                          {pages.length}
                        </span>
                      </div>
                    </div>
                  </footer>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
