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
import { SubmitButton } from '../ui'
import { PassageBlock } from './question/PassageBlock'
import { BODY_INDENT, QuestionBlock } from './question/QuestionBlock'
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

/**
 * 문제 본문 오른쪽에 `BODY_INDENT` 만큼 여백을 더 준다.
 *
 * 문제 블록은 번호만 왼쪽으로 내밀고 본문·보기 박스·선택지를 `BODY_INDENT` 들여쓴다.
 * 상자가 단 오른쪽 끝까지 닿는 것은 레퍼런스 문제지 그대로지만(보기 박스 99.0~405.5
 * = 단 오른쪽 끝), 옆 단이 없는 모바일에서는 그 11.3px 때문에 상자가 화면 오른쪽으로
 * 밀려 보인다. 오른쪽에 같은 값을 물려 좌우를 맞춘다.
 * **데스크톱 2단은 건드리지 않는다** — 폭이 바뀌면 패킹이 4쪽에서 흔들린다.
 */
const CONTENT_PAD_RIGHT = { paddingRight: BODY_INDENT }

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
      <section style={CONTENT_PAD_RIGHT}>
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
    <section style={CONTENT_PAD_RIGHT}>
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
  /** 지금 붙어 있는 장 수 — 표지 한 장 + (서명 뒤) 문제 쪽 */
  const pageCount = signed ? pages.length + 1 : 1

  /*
   * 종이 한 장의 배율 — 표지(842×1191)를 화면 폭에 맞춘 값. 스크롤러에서 한 번만
   * 재서 표지와 문제 쪽이 같이 쓴다 (장마다 따로 재면 넘길 때 종이가 들썩인다).
   * 첫 렌더에는 창 폭으로 어림잡아 시작하고 곧 실측으로 덮인다.
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

  /*
   * 키보드 좌·우로 장을 넘긴다 — 터치가 없는 화면에서 장을 넘기는 유일한 길이다.
   * 스냅이 붙는 자리는 장 폭의 배수이므로, 지금 위치를 폭으로 나눠 반올림한 것이
   * 곧 보고 있는 장 번호다.
   */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return

      // 글자를 적는 중이면 커서를 옮기는 방향키다 (PC 쪽 App.tsx 와 같은 규칙)
      const focused = event.target as HTMLElement | null
      if (focused?.closest('input, textarea, select')) return
      // 서명 창이 떠 있으면 창이 먼저다 — 뒤에서 종이가 넘어가면 안 된다
      if (document.querySelector('[role="dialog"]')) return

      const el = scrollerRef.current
      const width = el?.clientWidth ?? 0
      if (!el || width === 0) return

      const index = Math.round(el.scrollLeft / width)
      const next = index + (event.key === 'ArrowRight' ? 1 : -1)
      if (next < 0 || next > pageCount - 1) return

      event.preventDefault()
      el.scrollTo({ left: next * width, behavior: 'smooth' })
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [pageCount])

  return (
    <div className="h-full overflow-hidden text-ink">
      {/*
        장 넘김은 **터치 스와이프와 키보드 좌·우** 둘뿐이다. 마우스 드래그는 두지
        않는다 — 종이 위에서 손가락으로 미는 동작을 흉내 내려다 서명 캔버스·선택지와
        포인터를 두고 다퉜다. 가로 이동은 브라우저의 스냅 스크롤에 맡긴다.
      */}
      <div
        ref={scrollerRef}
        className="flex h-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* 표지 — 문제 페이지 앞의 한 장. 쪽 번호를 받지 않는다 */}
        <article
          className="h-full w-full shrink-0 snap-start snap-always overflow-y-auto overscroll-y-contain"
          aria-label="표지"
        >
          {/*
            표지는 폭에 맞춰 통째로 줄어 세로가 남으므로 가운데에 둔다.
            `justify-center` 는 스크롤 상자가 아니라 `min-h-full` 안쪽 상자에 건다 —
            화면이 표지보다 짧을 때 가운데 정렬이 위쪽을 잘라 먹지 않게.
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
              className="h-full w-full shrink-0 snap-start snap-always overflow-y-auto overscroll-y-contain text-[11.5px] leading-[1.48] break-words"
              aria-label={`${pageNumber} / ${pages.length} 페이지`}
            >
              {/*
                문제 쪽도 표지와 같은 크기의 종이(`minHeight: sheetH`) 위에 올린다 —
                장을 넘겨도 종이 크기와 여백이 그대로라 화면이 들썩이지 않는다.
                `height` 가 아니라 `minHeight` — 문제가 길면 종이가 늘어난다.

                흰 바탕은 바깥 `<article>` 이 아니라 **이 종이**가 깐다. 그래야 종이가
                화면보다 짧을 때 위아래로 책상(`body` 의 모눈·표지 벽지)이 드러난다 — 표지와 같다.
              */}
              <div className="flex min-h-full flex-col justify-center">
                <div className="flex flex-col bg-white px-4 py-6" style={{ minHeight: sheetH }}>
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

                  <div className="flex min-h-0 flex-1 flex-col">
                    <MobilePageContent
                      page={page}
                      answers={answers}
                      onSelect={onSelect}
                    />

                    {/*
                      제출 버튼은 마지막 문제 바로 밑이 아니라 **종이 아래쪽**, 저작권 줄
                      바로 위에 붙인다 (`mt-auto`) — 마지막 쪽은 문제가 하나뿐이라 그냥 두면
                      버튼이 종이 한가운데에 뜨고 그 아래가 통째로 빈다.
                      `pt-8` 은 문제가 길어 빈자리가 없을 때 지켜지는 최소 간격이다.
                    */}
                    {isLast ? (
                      <div className="mt-auto flex flex-col items-center gap-3 pt-8">
                        <SubmitButton onSubmit={onSubmit} />
                      </div>
                    ) : null}
                  </div>

                  <footer className="mt-8 shrink-0">
                    {/* 저작권은 쪽 번호 위 줄에 — 오른쪽 끝에 붙이면 좁은 화면에서 쪽 번호와 겹친다 */}
                    <p className="m-0 mb-1.5 text-center font-serif text-[8px] leading-none text-copyright">
                      {exam.meta.copyright}
                    </p>
                    <div className="flex h-7 items-center justify-center">
                      {/*
                        쪽 번호 상자 — PC 푸터(`SheetFooter`)의 28×64 를 0.85 로 줄인 값이다.
                        모바일 종이는 폭이 좁아 같은 크기로 두면 상자만 커 보인다.
                        글자와 자리 값도 같은 비율로 줄여야 대각선에 걸리지 않는다.
                      */}
                      <div className="relative h-[24px] w-[54px] border border-line">
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
                        <span className="absolute top-[1px] left-[3px] font-serif text-[12px] font-semibold leading-none">
                          {pageNumber}
                        </span>
                        <span className="absolute top-[9px] right-[3px] font-serif text-[12px] font-semibold leading-none">
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
