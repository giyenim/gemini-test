import { useCallback, useEffect, useRef, useState } from 'react'
import examData from './data/exam-sample.json'
import { ExamSheet } from './components/ExamSheet'
import { OneByOne } from './components/OneByOne'
import type { Answers, ChoiceIndex, ExamData, ViewMode } from './types/exam'

const exam = examData as ExamData

/** PDF aspect ratio base: 842 × 1191 */
export const PAGE_W = 842
export const PAGE_H = 1191

/** 1 = 화면 가로 100%, 줄이려면 0.9 / 0.8 등으로 조절 (가운데 정렬) */
const SHEET_ZOOM = 1

/** 바깥 여백(스테이지 패딩) — 폭이 줄면 스케일보다 여백이 먼저 줄어듦 */
const PAD_MAX = 24
const PAD_MIN = 0

export default function App() {
  const [viewMode] = useState<ViewMode>('sheet')
  const [answers, setAnswers] = useState<Answers>({})
  const [submitted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [pageIndex] = useState(0)
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
    if (viewMode !== 'sheet') return

    const update = () => {
      const el = stageRef.current
      if (!el) return

      const W = el.clientWidth
      const fit = (pad: number) => (W - pad * 2) / PAGE_W

      let nextPad = PAD_MAX
      let nextScale = Math.min(SHEET_ZOOM, fit(PAD_MAX))

      // 선호 크기(SHEET_ZOOM)가 max 여백에선 안 들어가면 → 여백부터 축소
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
  }, [viewMode])

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {viewMode === 'sheet' ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden" ref={stageRef}>
          <div
            className="flex min-h-0 flex-1 items-start justify-center overflow-auto [scrollbar-gutter:stable]"
            style={{ padding: stagePad }}
          >
            <div
              className="relative shrink-0"
              style={{
                width: PAGE_W * scale,
                height: PAGE_H * scale,
              }}
            >
              <div
                className="absolute top-0 left-0 origin-top-left"
                style={{
                  width: PAGE_W,
                  height: PAGE_H,
                  transform: `scale(${scale})`,
                }}
              >
                <ExamSheet
                  exam={exam}
                  answers={answers}
                  submitted={submitted}
                  onSelect={onSelect}
                  pageIndex={pageIndex}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto min-h-0 w-full max-w-[720px] flex-1 overflow-auto p-4">
          <main>
            <OneByOne
              exam={exam}
              answers={answers}
              submitted={submitted}
              onSelect={onSelect}
              currentIndex={currentIndex}
              onChangeIndex={setCurrentIndex}
            />
          </main>
        </div>
      )}
    </div>
  )
}
