import { useEffect, useRef, useState } from 'react'
import { HEADER_FIRST_H, PAGE_PAD_X, PAGE_W } from '../layout/constants'
import type { Answers, ChoiceIndex, ExamData, ExamMeta, Passage, Question } from '../types/exam'
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
  submitted: boolean
  onSelect: (questionId: number, choice: ChoiceIndex) => void
}

/** PC 1페이지 헤더와 동일 컴포넌트, 화면 폭에 맞게 scale */
function MobileSheetHeader({
  meta,
  pageNumber,
}: {
  meta: ExamMeta
  pageNumber: number
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
        <SheetHeaderFirst meta={meta} pageNumber={pageNumber} />
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
  submitted,
  onSelect,
}: {
  page: MobilePage
  answers: Answers
  submitted: boolean
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
                submitted={submitted}
                onSelect={(choice) => onSelect(question.id, choice)}
                renderStem={(stem) => <>{highlightTerms(stem)}</>}
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
        submitted={submitted}
        onSelect={(choice) => onSelect(page.question.id, choice)}
        renderStem={(stem) => <>{highlightTerms(stem)}</>}
      />
    </section>
  )
}

export function MobileExamView({
  exam,
  answers,
  submitted,
  onSelect,
}: MobileExamViewProps) {
  const pages = buildMobilePages(exam)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    scrollLeft: number
    axis: 'none' | 'x' | 'y'
  } | null>(null)
  const [dragging, setDragging] = useState(false)

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
    <div className="h-full overflow-hidden bg-[#2a2a2a] text-ink">
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
        {pages.map((page, index) => {
          const pageNumber = index + 1
          return (
            <article
              key={page.key}
              className="h-full w-full shrink-0 snap-start snap-always overflow-y-auto overscroll-y-contain bg-white text-[11.5px] leading-[1.48] break-keep break-words"
              aria-label={`${pageNumber} / ${pages.length} 페이지`}
            >
              {/* min-h-full + flex-1: 짧은 콘텐츠면 풋터를 화면 하단 근처에, 길면 콘텐츠 아래로 밀어냄 */}
              <div className="flex min-h-full flex-col px-4 pt-6 pb-8">
                {index === 0 ? (
                  <MobileSheetHeader meta={exam.meta} pageNumber={pageNumber} />
                ) : (
                  <div className="mb-4">
                    <SheetHeaderContinued meta={exam.meta} pageNumber={pageNumber} />
                  </div>
                )}

                <div className="min-h-0 flex-1">
                  <MobilePageContent
                    page={page}
                    answers={answers}
                    submitted={submitted}
                    onSelect={onSelect}
                  />
                </div>

                <footer className="mt-8 shrink-0">
                  <div className="relative flex h-7 items-center justify-center">
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
                    <p className="absolute right-0 bottom-0 m-0 max-w-[42%] truncate text-right font-serif text-[9px] leading-none text-[#6b8cae]">
                      {exam.meta.copyright}
                    </p>
                  </div>
                </footer>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
