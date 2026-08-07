import { useCallback, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import type { Answers, ChoiceIndex, ExamData, Examinee } from '../types/exam'
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
import { CoverSheet } from './CoverSheet'
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
  examinee: Examinee | null
  onSelect: (questionId: number, choice: ChoiceIndex) => void
  onSubmit: () => void
  /** 표지 성명 칸에 적은 이름 — 속지 헤더·성적표까지 따라간다 */
  onNameChange: (name: string) => void
  /** 지금 보여 줄 쪽. 0 = 표지, 1부터 문제 페이지 */
  pageIndex: number
  /** 표지를 포함한 총 쪽수 — 패킹이 끝나야 알 수 있어 올려 보낸다 */
  onPageCount: (count: number) => void
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
  onSelect: (questionId: number, choice: ChoiceIndex) => void,
  onSubmit: () => void,
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
      <div className="flex flex-col items-end gap-2">
        <ExamActionButton onClick={onSubmit}>제출</ExamActionButton>
      </div>
    )
  }

  const question = exam.questions.find((q) => q.id === item.questionId)
  if (!question) return null
  return (
    <QuestionBlock
      question={question}
      selected={answers[question.id]}
      submitted={false}
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
  examinee,
  onSelect,
  onSubmit,
}: {
  page: PackedPage
  pageNumber: number
  totalPages: number
  exam: ExamData
  answers: Answers
  examinee: Examinee | null
  onSelect: (questionId: number, choice: ChoiceIndex) => void
  onSubmit: () => void
}) {
  const renderItem = (item: PlacedItem) =>
    renderPlacedItem(item, exam, answers, onSelect, onSubmit)

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
          examinee={examinee}
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
  examinee,
  onSelect,
  onSubmit,
  onNameChange,
  pageIndex,
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
      // 표지 한 장을 더한 값이 화면에 보이는 총 쪽수다
      onPageCount(packed.length + 1)
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
      {/*
        한 번에 한 쪽만 그린다. 0 = 표지, 1부터 문제 페이지.
        표지는 쪽 번호를 받지 않으므로 문제 페이지는 그대로 1쪽부터다.
      */}
      {pageIndex === 0 ? (
        <CoverSheet meta={exam.meta} examinee={examinee} onNameChange={onNameChange} />
      ) : pages == null ? (
        <div className="h-[1191px] w-[842px] bg-white" />
      ) : (
        (() => {
          const page = pages[pageIndex - 1]
          if (!page) return <div className="h-[1191px] w-[842px] bg-white" />
          return (
            <SheetPageView
              page={page}
              pageNumber={pageIndex}
              totalPages={pages.length}
              exam={exam}
              answers={answers}
              examinee={examinee}
              onSelect={onSelect}
              onSubmit={onSubmit}
            />
          )
        })()
      )}
    </div>
  )
}
