import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import examData from './data/exam-sample.json'
import { AnswerKeyView } from './components/AnswerKeyView'
import { ExamSheet } from './components/ExamSheet'
import { MobileExamView } from './components/MobileExamView'
import { gradeExam } from './grade'
import { PAGE_H, PAGE_W } from './layout/constants'
import type { Answers, ChoiceIndex, ExamData } from './types/exam'

// JSON 리터럴은 문자열 유니온·튜플로 좁혀지지 않으므로 한 번에 단언한다
const exam = examData as unknown as ExamData
const MOBILE_MEDIA_QUERY = '(max-width: 767px)'

/**
 * 시험지 최대 배율. 화면이 넓으면 이 값까지 **키워서** 보여 주고,
 * 좁으면 폭에 맞춰 자동으로 줄인다 (가운데 정렬).
 * 1 = 원래 크기(842px). 키울수록 좌우 검은 여백이 줄고 글자가 커진다.
 * 레이아웃은 원래 크기로 계산한 뒤 CSS로 확대하므로 쪽수에는 영향이 없다.
 */
const SHEET_ZOOM = 1.35

/** 바깥 여백(스테이지 패딩) — 폭이 줄면 스케일보다 여백이 먼저 줄어듦 */
const PAD_MAX = 24
const PAD_MIN = 0

/** ExamSheet 페이지 사이 gap-6 */
const PAGE_GAP = 24

export { PAGE_W, PAGE_H }

type ViewMode = 'exam' | 'answerKey'

export default function App() {
  const [answers, setAnswers] = useState<Answers>({})
  const [submitted, setSubmitted] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('exam')
  const [pageCount, setPageCount] = useState(1)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(MOBILE_MEDIA_QUERY).matches
      : false,
  )
  const [scale, setScale] = useState(SHEET_ZOOM)
  const [stagePad, setStagePad] = useState(PAD_MAX)
  const stageScrollRef = useRef<HTMLDivElement>(null)
  const scaleRef = useRef(SHEET_ZOOM)
  const padRef = useRef(PAD_MAX)

  const score = useMemo(
    () => (submitted ? gradeExam(exam, answers) : null),
    [submitted, answers],
  )

  const onSelect = useCallback((questionId: number, choice: ChoiceIndex) => {
    if (submitted) return
    setAnswers((prev) => ({ ...prev, [questionId]: choice }))
  }, [submitted])

  const onSubmit = useCallback(() => {
    setSubmitted(true)
    stageScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const onShowAnswerKey = useCallback(() => {
    setViewMode('answerKey')
  }, [])

  const onBackToExam = useCallback(() => {
    setViewMode('exam')
  }, [])

  useEffect(() => {
    const media = window.matchMedia(MOBILE_MEDIA_QUERY)
    const update = (event?: MediaQueryListEvent) => {
      setIsMobile(event ? event.matches : media.matches)
    }

    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (isMobile || viewMode !== 'exam') return

    const update = () => {
      // 스크롤 컨테이너를 재야 한다 — 바깥 래퍼를 재면 세로 스크롤바
      // 자리(scrollbar-gutter)가 빠지지 않아 가로 스크롤이 생긴다
      const el = stageScrollRef.current
      if (!el) return

      const W = el.clientWidth
      const fit = (pad: number) => (W - pad * 2) / PAGE_W

      let nextPad = PAD_MAX
      let nextScale = Math.min(SHEET_ZOOM, fit(PAD_MAX))

      if (fit(PAD_MAX) < SHEET_ZOOM) {
        nextPad = Math.max(PAD_MIN, (W - PAGE_W * SHEET_ZOOM) / 2)
        if (fit(nextPad) >= SHEET_ZOOM) {
          nextScale = SHEET_ZOOM
        } else {
          nextPad = PAD_MIN
          nextScale = Math.max(0.2, fit(PAD_MIN))
        }
      }

      if (
        Math.abs(nextScale - scaleRef.current) < 0.002 &&
        Math.abs(nextPad - padRef.current) < 0.5
      ) {
        return
      }
      scaleRef.current = nextScale
      padRef.current = nextPad
      setScale(nextScale)
      setStagePad(nextPad)
    }

    update()
    const observer = new ResizeObserver(update)
    if (stageScrollRef.current) observer.observe(stageScrollRef.current)
    window.addEventListener('resize', update)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [isMobile, viewMode])

  if (viewMode === 'answerKey') {
    return (
      <div className="h-full min-h-0 overflow-hidden">
        <AnswerKeyView exam={exam} onBack={onBackToExam} />
      </div>
    )
  }

  const stackH =
    pageCount * PAGE_H + Math.max(0, pageCount - 1) * PAGE_GAP

  if (isMobile) {
    return (
      <div className="h-full min-h-0 overflow-hidden">
        <MobileExamView
          exam={exam}
          answers={answers}
          submitted={submitted}
          score={score}
          onSelect={onSelect}
          onSubmit={onSubmit}
          onShowAnswerKey={onShowAnswerKey}
        />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          ref={stageScrollRef}
          className="flex min-h-0 flex-1 items-start justify-center overflow-auto [scrollbar-gutter:stable]"
          style={{ padding: stagePad }}
        >
          <div
            className="relative shrink-0"
            style={{
              width: PAGE_W * scale,
              height: stackH * scale,
            }}
          >
            <div
              className="absolute top-0 left-0 origin-top-left"
              style={{
                width: PAGE_W,
                height: stackH,
                transform: `scale(${scale})`,
              }}
            >
              <ExamSheet
                exam={exam}
                answers={answers}
                submitted={submitted}
                score={score}
                onSelect={onSelect}
                onSubmit={onSubmit}
                onShowAnswerKey={onShowAnswerKey}
                onPageCount={setPageCount}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
