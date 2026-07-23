import { useCallback, useEffect, useRef, useState } from 'react'
import examData from './data/exam-sample.json'
import { ExamSheet } from './components/ExamSheet'
import { MobileExamView } from './components/MobileExamView'
import { PAGE_H, PAGE_W } from './layout/constants'
import type { Answers, ChoiceIndex, ExamData } from './types/exam'

const exam = examData as ExamData
const MOBILE_MEDIA_QUERY = '(max-width: 767px)'

/** 1 = 화면 가로 100%, 줄이려면 0.9 / 0.8 등으로 조절 (가운데 정렬) */
const SHEET_ZOOM = 1

/** 바깥 여백(스테이지 패딩) — 폭이 줄면 스케일보다 여백이 먼저 줄어듦 */
const PAD_MAX = 24
const PAD_MIN = 0

/** ExamSheet 페이지 사이 gap-6 */
const PAGE_GAP = 24

export { PAGE_W, PAGE_H }

export default function App() {
  const [answers, setAnswers] = useState<Answers>({})
  const [submitted] = useState(false)
  const [pageCount, setPageCount] = useState(1)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(MOBILE_MEDIA_QUERY).matches
      : false,
  )
  const [scale, setScale] = useState(SHEET_ZOOM)
  const [stagePad, setStagePad] = useState(PAD_MAX)
  const stageRef = useRef<HTMLDivElement>(null)
  const scaleRef = useRef(SHEET_ZOOM)
  const padRef = useRef(PAD_MAX)

  const onSelect = useCallback((questionId: number, choice: ChoiceIndex) => {
    if (submitted) return
    setAnswers((prev) => ({ ...prev, [questionId]: choice }))
  }, [submitted])

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
    if (isMobile) return

    const update = () => {
      const el = stageRef.current
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
    if (stageRef.current) observer.observe(stageRef.current)
    window.addEventListener('resize', update)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [isMobile])

  const stackH =
    pageCount * PAGE_H + Math.max(0, pageCount - 1) * PAGE_GAP

  if (isMobile) {
    return (
      <div className="h-full min-h-0 overflow-hidden">
        <MobileExamView
          exam={exam}
          answers={answers}
          submitted={submitted}
          onSelect={onSelect}
        />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden" ref={stageRef}>
        <div
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
                onSelect={onSelect}
                onPageCount={setPageCount}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
