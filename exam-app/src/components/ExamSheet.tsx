import { useCallback, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import type { ExamScore } from '../grade'
import type { Answers, ChoiceIndex, ExamData } from '../types/exam'
import {
  columnWidth,
  contentHeight,
  PAGE_PAD_BOTTOM,
  PAGE_PAD_TOP,
  PAGE_PAD_X,
  PAGE_W,
  TARGET_COLUMNS,
} from '../layout/constants'
import { packSheet } from '../layout/packSheet'
import type {
  PackedPage,
  PackItem,
  PassageMeasure,
  PassageSegment,
  PlacedItem,
} from '../layout/types'
import { ExamActionButton } from './ExamActionButton'
import { PassageBlock, type PassageBoxMode } from './question/PassageBlock'
import { QuestionBlock } from './question/QuestionBlock'
import { SheetColumn } from './SheetColumn'
import { SheetContent } from './SheetContent'
import { SheetFooter } from './SheetFooter'
import { SheetHeader } from './SheetHeader'
import { highlightTerms } from './examText'

interface ExamSheetProps {
  exam: ExamData
  answers: Answers
  submitted: boolean
  score: ExamScore | null
  onSelect: (questionId: number, choice: ChoiceIndex) => void
  onSubmit: () => void
  onShowAnswerKey: () => void
  onPageCount?: (count: number) => void
}

function appendHighlighted(el: HTMLElement, text: string) {
  el.appendChild(document.createTextNode(text))
}

/**
 * 데이터 순서를 시험지 배치 단위로 묶는다.
 * 지문에 묶인 문제는 지문 묶음으로, 나머지는 연속 구간(run)으로 모은다.
 */
function buildPackItems(
  exam: ExamData,
  passages: PassageMeasure[],
): PackItem[] {
  const byId = new Map(passages.map((p) => [p.id, p]))
  const items: PackItem[] = []
  const donePassages = new Set<string>()
  let run: number[] = []

  const flushRun = () => {
    if (run.length > 0) {
      items.push({ kind: 'questions', questionIds: run })
      run = []
    }
  }

  for (const q of exam.questions) {
    const passage = q.passageId ? byId.get(q.passageId) : undefined
    if (passage) {
      if (donePassages.has(passage.id)) continue
      donePassages.add(passage.id)
      flushRun()
      items.push({ kind: 'passage', passage })
    } else {
      run.push(q.id)
    }
  }
  flushRun()

  return items
}

function boxMode(openTop: boolean, openBottom: boolean): PassageBoxMode {
  if (openTop && openBottom) return 'open-both'
  if (openTop) return 'open-top'
  if (openBottom) return 'open-bottom'
  return 'full'
}

function splitParagraphs(body: string): string[] {
  return body.split('\n\n').filter(Boolean)
}

/** 패킹용 지문 조각 높이 실측 (PassageBlock과 동일 스타일) */
function measurePassageDom(
  probe: HTMLDivElement,
  exam: ExamData,
  passageId: string,
  showIntro: boolean,
  segments: PassageSegment[],
  openTop = false,
  openBottom = false,
): number {
  const passage = exam.passages.find((p) => p.id === passageId)
  if (!passage) return 0

  probe.replaceChildren()

  if (showIntro) {
    const intro = document.createElement('p')
    intro.className = 'mb-1.5 text-[11.5px] font-normal'
    const strong = document.createElement('strong')
    strong.className = 'font-bold'
    strong.textContent = passage.label
    intro.appendChild(strong)
    intro.appendChild(document.createTextNode(` ${passage.intro}`))
    probe.appendChild(intro)
  }

  if (segments.length > 0) {
    const box = document.createElement('div')
    if (openTop && openBottom) {
      box.className = 'border-x-[1.25px] border-line px-2.5 py-0'
    } else if (openBottom) {
      box.className =
        'border-t-[1.25px] border-x-[1.25px] border-line px-2.5 pt-2 pb-0'
    } else if (openTop) {
      box.className =
        'border-b-[1.25px] border-x-[1.25px] border-line px-2.5 pt-0 pb-2'
    } else {
      box.className = 'border-[1.25px] border-line px-2.5 py-2'
    }
    const inner = document.createElement('div')
    // PassageBlock 안쪽 div와 같은 클래스여야 측정과 렌더가 어긋나지 않는다
    inner.className = 'text-[11.5px] leading-normal'
    segments.forEach((seg, i) => {
      const p = document.createElement('p')
      const isLast = i === segments.length - 1
      p.className = seg.indent ? 'indent-[1em]' : ''
      p.style.marginBottom = isLast ? '0' : '0.5em'
      appendHighlighted(p, seg.text)
      inner.appendChild(p)
    })
    box.appendChild(inner)
    probe.appendChild(box)
  }

  return probe.offsetHeight
}

function MeasureLayer({
  exam,
  colW,
  probeRef,
  onMeasured,
}: {
  exam: ExamData
  colW: number
  probeRef: RefObject<HTMLDivElement | null>
  onMeasured: (
    passages: PassageMeasure[],
    questionHeights: Map<number, number>,
  ) => void
}) {
  const rootRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return

    const measure = () => {
      const questionHeights = new Map<number, number>()
      const passages: PassageMeasure[] = exam.passages.map((p) => {
        const introEl = root.querySelector<HTMLElement>(
          `[data-measure="intro:${p.id}"]`,
        )
        const chromeEl = root.querySelector<HTMLElement>(
          `[data-measure="chrome:${p.id}"]`,
        )
        const fullEl = root.querySelector<HTMLElement>(
          `[data-measure="full:${p.id}"]`,
        )
        const paras = splitParagraphs(p.body)
        return {
          id: p.id,
          introHeight: introEl
            ? introEl.offsetHeight +
              (parseFloat(getComputedStyle(introEl).marginBottom) || 0)
            : 0,
          boxChrome: chromeEl?.offsetHeight ?? 18.5,
          fullHeight: fullEl?.offsetHeight ?? 0,
          paragraphs: paras,
          questionIds: [...p.questionIds],
        }
      })

      for (const q of exam.questions) {
        const el = root.querySelector<HTMLElement>(
          `[data-measure="question:${q.id}"]`,
        )
        questionHeights.set(q.id, el?.offsetHeight ?? 0)
      }

      onMeasured(passages, questionHeights)
    }

    measure()
    void document.fonts.ready.then(measure)
  }, [exam, colW, onMeasured])

  return (
    // 바깥 래퍼로 잘라내 측정용 DOM이 스크롤 영역을 늘리지 않게 한다
    <div
      aria-hidden
      className="pointer-events-none absolute top-0 left-0 h-0 w-0 overflow-hidden"
    >
    <div
      ref={rootRef}
      className="text-[11.5px] leading-[1.48] break-words opacity-0"
      style={{ width: colW }}
    >
      {/* 글자 단위 분할 실측 프로브 */}
      <div ref={probeRef} data-measure-probe="passage" />

      {exam.passages.map((p) => {
        const paras = splitParagraphs(p.body)
        const segments = paras.map((text) => ({ text, indent: true }))
        return (
          <div key={p.id}>
            <p data-measure={`intro:${p.id}`} className="mb-1.5 text-[11.5px]">
              <strong className="font-bold">{p.label}</strong> {p.intro}
            </p>
            <div
              data-measure={`chrome:${p.id}`}
              className="border-[1.25px] border-line px-2.5 py-2"
            />
            <div data-measure={`full:${p.id}`}>
              <PassageBlock
                label={p.label}
                intro={p.intro}
                segments={segments}
                renderBody={(para) => <>{highlightTerms(para)}</>}
              />
            </div>
          </div>
        )
      })}
      {exam.questions.map((q) => (
        <div key={q.id} data-measure={`question:${q.id}`}>
          <QuestionBlock
            question={q}
            submitted={false}
            onSelect={() => {}}
            renderText={(text) => <>{highlightTerms(text)}</>}
            anchor={false}
          />
        </div>
      ))}
    </div>
    </div>
  )
}

function renderPlacedItem(
  item: PlacedItem,
  exam: ExamData,
  answers: Answers,
  submitted: boolean,
  score: ExamScore | null,
  onSelect: (questionId: number, choice: ChoiceIndex) => void,
  onSubmit: () => void,
  onShowAnswerKey: () => void,
): ReactNode {
  if (item.type === 'passage') {
    const passage = exam.passages.find((p) => p.id === item.passageId)
    if (!passage) return null
    return (
      <PassageBlock
        label={passage.label}
        intro={passage.intro}
        segments={item.segments}
        showIntro={item.showIntro}
        boxMode={boxMode(item.openTop, item.openBottom)}
        fillColumn={item.openBottom}
        renderBody={(para) => <>{highlightTerms(para)}</>}
      />
    )
  }

  if (item.type === 'submit-action') {
    return (
      <div className="flex flex-col items-start gap-2">
        {!submitted ? (
          <ExamActionButton onClick={onSubmit}>제출</ExamActionButton>
        ) : (
          <>
            {score ? (
              <p className="m-0 font-serif text-[16px] font-bold text-check">
                {score.earned}/{score.max}점
              </p>
            ) : null}
            <ExamActionButton onClick={onShowAnswerKey}>답지 보기</ExamActionButton>
          </>
        )}
      </div>
    )
  }

  const question = exam.questions.find((q) => q.id === item.questionId)
  if (!question) return null
  return (
    <QuestionBlock
      question={question}
      selected={answers[question.id]}
      submitted={submitted}
      onSelect={(choice) => onSelect(question.id, choice)}
      renderText={(text) => <>{highlightTerms(text)}</>}
    />
  )
}

function SheetPageView({
  page,
  pageNumber,
  totalPages,
  exam,
  answers,
  submitted,
  score,
  onSelect,
  onSubmit,
  onShowAnswerKey,
}: {
  page: PackedPage
  pageNumber: number
  totalPages: number
  exam: ExamData
  answers: Answers
  submitted: boolean
  score: ExamScore | null
  onSelect: (questionId: number, choice: ChoiceIndex) => void
  onSubmit: () => void
  onShowAnswerKey: () => void
}) {
  const renderItem = (item: PlacedItem) =>
    renderPlacedItem(
      item,
      exam,
      answers,
      submitted,
      score,
      onSelect,
      onSubmit,
      onShowAnswerKey,
    )

  return (
    <div
      className="h-[1191px] w-[842px] overflow-hidden bg-white text-ink"
      data-page={pageNumber}
    >
      <div
        className="flex h-full flex-col"
        style={{
          paddingLeft: PAGE_PAD_X,
          paddingRight: PAGE_PAD_X,
          paddingTop: PAGE_PAD_TOP,
          paddingBottom: PAGE_PAD_BOTTOM,
        }}
      >
        <SheetHeader
          kind={page.headerKind}
          meta={exam.meta}
          pageNumber={pageNumber}
          score={page.headerKind === 'first' && submitted ? score : null}
        />
        <SheetContent
          left={
            <SheetColumn items={page.left.items} renderItem={renderItem} />
          }
          right={
            <SheetColumn items={page.right.items} renderItem={renderItem} />
          }
        />
        <SheetFooter
          meta={exam.meta}
          pageNumber={pageNumber}
          totalPages={totalPages}
        />
      </div>
    </div>
  )
}

export function ExamSheet({
  exam,
  answers,
  submitted,
  score,
  onSelect,
  onSubmit,
  onShowAnswerKey,
  onPageCount,
}: ExamSheetProps) {
  const colW = columnWidth(PAGE_W)
  const probeRef = useRef<HTMLDivElement>(null)
  const [pages, setPages] = useState<PackedPage[] | null>(null)

  const onMeasured = useCallback(
    (passages: PassageMeasure[], questionHeights: Map<number, number>) => {
      const probe = probeRef.current
      if (!probe) return

      const packed = packSheet({
        items: buildPackItems(exam, passages),
        questionHeights,
        targetColumns: TARGET_COLUMNS,
        contentHeightFirst: contentHeight('first'),
        contentHeightContinued: contentHeight('continued'),
        measurePassage: ({
          passageId,
          showIntro,
          segments,
          openTop,
          openBottom,
        }) =>
          measurePassageDom(
            probe,
            exam,
            passageId,
            showIntro,
            segments,
            openTop,
            openBottom,
          ),
      })
      setPages(packed)
      onPageCount?.(packed.length)
    },
    [exam, onPageCount],
  )

  return (
    <div className="relative">
      <MeasureLayer
        exam={exam}
        colW={colW}
        probeRef={probeRef}
        onMeasured={onMeasured}
      />
      <div className="flex flex-col gap-6">
        {pages == null ? (
          <div className="h-[1191px] w-[842px] bg-white" />
        ) : (
          pages.map((page, i) => (
            // 배경이 흰색이라 쪽 경계가 보이지 않는다.
            // 페이지 사이 gap-6(24) 한가운데에 옅은 회색 점선을 그어 쪽을 나눈다.
            // 선은 absolute라 스택 높이(App의 stackH)를 건드리지 않는다.
            <div key={i} className="relative">
              {i > 0 ? (
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-3 right-0 left-0 border-t border-dashed border-[var(--color-page-divider)]"
                />
              ) : null}
              <SheetPageView
                page={page}
                pageNumber={i + 1}
                totalPages={pages.length}
                exam={exam}
                answers={answers}
                submitted={submitted}
                score={score}
                onSelect={onSelect}
                onSubmit={onSubmit}
                onShowAnswerKey={onShowAnswerKey}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
