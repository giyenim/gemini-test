import { useCallback, useEffect, useRef, useState } from 'react'
import examData from './data/exam-sample.json'
import { ExamSheet, getSheetPageCount } from './components/ExamSheet'
import { OneByOne } from './components/OneByOne'
import type { Answers, ChoiceIndex, ExamData, ViewMode } from './types/exam'

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
    <div className="flex h-full flex-col overflow-hidden">
      {viewMode === 'sheet' ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden" ref={stageRef}>
          <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto p-6 [scrollbar-gutter:stable]">
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

          <nav
            className="flex shrink-0 items-center justify-center gap-4 border-t border-[#e0e0e0] bg-white px-4 py-3 font-serif"
            aria-label="페이지 이동"
          >
            <button
              type="button"
              className="min-w-[72px] border border-[#666] bg-white px-4 py-1.5 text-[13px] font-medium hover:enabled:bg-[#f3f3f3]"
              disabled={pageIndex <= 0}
              onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
            >
              이전
            </button>
            <span className="min-w-12 text-center text-[13px] font-semibold">
              {pageIndex + 1} / {getSheetPageCount(exam)}
            </span>
            <button
              type="button"
              className="min-w-[72px] border border-[#666] bg-white px-4 py-1.5 text-[13px] font-medium hover:enabled:bg-[#f3f3f3]"
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
        <div className="mx-auto min-h-0 w-[720px] flex-1 overflow-auto p-4">
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
