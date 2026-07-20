import { useCallback, useEffect, useRef, useState } from 'react'
import examData from './data/exam-sample.json'
import { ExamSheet, getSheetPageCount } from './components/ExamSheet'
import { OneByOne } from './components/OneByOne'
import type { Answers, ChoiceIndex, ExamData, ViewMode } from './types/exam'
import './App.css'

const exam = examData as ExamData

/** PDF MediaBox: 842 × 1191 pt */
export const PAGE_W = 842
export const PAGE_H = 1191

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('sheet')
  const [answers, setAnswers] = useState<Answers>({})
  const [submitted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [pageIndex, setPageIndex] = useState(0)
  const [scale, setScale] = useState(1)
  const stageRef = useRef<HTMLDivElement>(null)

  const onSelect = useCallback((questionId: number, choice: ChoiceIndex) => {
    if (submitted) return
    setAnswers((prev) => ({ ...prev, [questionId]: choice }))
  }, [submitted])

  useEffect(() => {
    if (viewMode !== 'sheet') return

    const update = () => {
      const el = stageRef.current
      if (!el) return
      const pad = 32
      const navH = 56
      const availableW = el.clientWidth - pad * 2
      const availableH = el.clientHeight - pad * 2 - navH
      const next = Math.min(availableW / PAGE_W, availableH / PAGE_H, 1)
      setScale(Math.max(0.35, next))
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
      <header className="app-toolbar">
        <div className="toolbar-brand">
          <span className="toolbar-subject">{exam.meta.subject}</span>
          <span className="toolbar-sub">
            {exam.meta.year} · {exam.meta.type} 샘플
          </span>
        </div>

        <div className="mode-toggle" role="group" aria-label="보기 모드">
          <button
            type="button"
            className={viewMode === 'sheet' ? 'is-active' : ''}
            onClick={() => setViewMode('sheet')}
          >
            수능형
          </button>
          <button
            type="button"
            className={viewMode === 'one' ? 'is-active' : ''}
            onClick={() => setViewMode('one')}
          >
            한 문제씩
          </button>
        </div>
      </header>

      {viewMode === 'sheet' ? (
        <div className="app-stage" ref={stageRef}>
          <div className="stage-center">
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
