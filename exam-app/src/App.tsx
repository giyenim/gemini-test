import { useCallback, useEffect, useRef, useState } from 'react'
import examData from './data/exam-sample.json'
import { ExamSheet, getSheetPageCount } from './components/ExamSheet'
import { OneByOne } from './components/OneByOne'
import type { Answers, ChoiceIndex, ExamData, ViewMode } from './types/exam'
import './App.css'

const exam = examData as ExamData

/** PDF aspect ratio base: 842 × 1191 */
export const PAGE_W = 842
export const PAGE_H = 1191

/** 1 = 화면 가로 100%, 줄이려면 0.9 / 0.8 등으로 조절 (가운데 정렬) */
const SHEET_ZOOM = 0.5

export default function App() {
  const [viewMode] = useState<ViewMode>('sheet')
  const [answers, setAnswers] = useState<Answers>({})
  const [submitted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [pageIndex, setPageIndex] = useState(0)
  const [scale, setScale] = useState(1)
  const stageRef = useRef<HTMLDivElement>(null)
  const scaleRef = useRef(1)

  const onSelect = useCallback((questionId: number, choice: ChoiceIndex) => {
    if (submitted) return
    setAnswers((prev) => ({ ...prev, [questionId]: choice }))
  }, [submitted])

  useEffect(() => {
    if (viewMode !== 'sheet') return

    const update = () => {
      const el = stageRef.current
      if (!el) return
      // Measure stable stage width (not the scroll child) to avoid
      // scrollbar ↔ scale feedback that causes vibration.
      const next = (el.clientWidth / PAGE_W) * SHEET_ZOOM
      if (Math.abs(next - scaleRef.current) < 0.002) return
      scaleRef.current = next
      setScale(next)
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
    <div className={`app app-${viewMode}`}>
      {viewMode === 'sheet' ? (
        <div className="app-stage" ref={stageRef}>
          <div className="stage-scroll">
            <div
              className="page-scale"
              style={{
                width: PAGE_W * scale,
                height: PAGE_H * scale,
              }}
            >
              <div
                className="page-scale-inner"
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

          <nav className="page-nav" aria-label="페이지 이동">
            <button
              type="button"
              className="page-nav-btn"
              disabled={pageIndex <= 0}
              onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
            >
              이전
            </button>
            <span className="page-nav-status">
              {pageIndex + 1} / {getSheetPageCount(exam)}
            </span>
            <button
              type="button"
              className="page-nav-btn"
              disabled={pageIndex >= getSheetPageCount(exam) - 1}
              onClick={() =>
                setPageIndex((i) =>
                  Math.min(getSheetPageCount(exam) - 1, i + 1),
                )
              }
            >
              다음
            </button>
          </nav>
        </div>
      ) : (
        <div className="app-layout">
          <main className="app-main">
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
