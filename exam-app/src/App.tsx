import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import examData from './data/exam-sample.json'
import { ExamSheet } from './components/ExamSheet'
import { MobileExamView } from './components/MobileExamView'
import { PageNav } from './components/PageNav'
import { GradingOverlay } from './components/result/GradingOverlay'
import { ResultView } from './components/result/ResultView'
import { issueExaminee } from './examinee'
import { gradeExam } from './grade'
import { MOBILE_MEDIA_QUERY, PAGE_H, PAGE_W } from './layout/constants'
import type { Answers, ChoiceIndex, ExamData, Examinee } from './types/exam'

// JSON 리터럴은 문자열 유니온·튜플로 좁혀지지 않으므로 한 번에 단언한다
const exam = examData as unknown as ExamData

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

/** 제출 후 성적표까지 끄는 시간 (RESULT-PAGE.md §1) */
const GRADING_MS = 3000

export { PAGE_W, PAGE_H }

/**
 * 응시 흐름 — 표지 → 시험 → 채점 중 → 성적표.
 *
 * 실제 시험지처럼 **표지부터 바로 시작한다.** 이름은 표지 성명 칸에 직접 적고,
 * 수험 번호는 화면에 들어온 시각으로 발급된다. 되돌아가는 길은 두지 않는다
 * (RESULT-PAGE.md §7 "다시 응시하기" 제외).
 */
type Phase = 'exam' | 'grading' | 'result'

export default function App() {
  const [answers, setAnswers] = useState<Answers>({})
  // 표지를 여는 순간이 곧 응시 시작이다
  const [examinee, setExaminee] = useState<Examinee>(() => issueExaminee())
  const [phase, setPhase] = useState<Phase>('exam')
  // 데스크톱은 한 번에 한 쪽만 본다. 0 = 표지, 1부터 문제 페이지
  const [pageIndex, setPageIndex] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(MOBILE_MEDIA_QUERY).matches
      : false,
  )
  const [scale, setScale] = useState(SHEET_ZOOM)
  const [stagePad, setStagePad] = useState(PAD_MAX)
  const stageScrollRef = useRef<HTMLDivElement>(null)
  const totalPagesRef = useRef(1)
  const scaleRef = useRef(SHEET_ZOOM)
  const padRef = useRef(PAD_MAX)

  const graded = phase === 'grading' || phase === 'result'
  const score = useMemo(
    () => (graded ? gradeExam(exam, answers) : null),
    [graded, answers],
  )

  const onSelect = useCallback((questionId: number, choice: ChoiceIndex) => {
    if (phase !== 'exam') return
    setAnswers((prev) => ({ ...prev, [questionId]: choice }))
  }, [phase])

  // 표지 성명 칸 — 쓰는 즉시 속지 헤더와 성적표에 같은 서명이 반영된다
  const onSignatureChange = useCallback((signature: string | null) => {
    setExaminee((prev) => ({ ...prev, signature }))
  }, [])

  const goToPage = useCallback((next: number) => {
    setPageIndex((prev) => {
      const clamped = Math.min(totalPagesRef.current - 1, Math.max(0, next))
      if (clamped !== prev) stageScrollRef.current?.scrollTo({ top: 0 })
      return clamped
    })
  }, [])

  const onSubmit = useCallback(() => {
    setPhase('grading')
  }, [])

  const onPageCount = useCallback((count: number) => {
    totalPagesRef.current = count
    setTotalPages(count)
  }, [])

  // 표지에서 아직 서명하지 않았다 — 넘김 버튼도 방향키도 여기서 멈춘다
  const needsSignature = pageIndex === 0 && !examinee.signature

  // ← → 로도 쪽을 넘긴다. 표지 성명 칸에 쓰는 중이면 건드리지 않는다
  useEffect(() => {
    if (phase !== 'exam' || isMobile) return
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el?.closest('input, textarea, select')) return
      /*
       * 서명 창이 떠 있는 동안은 넘기지 않는다. 창은 `body` 에 포털로 붙어 있어
       * 이 핸들러의 사정권 밖이고, 그대로 두면 창 뒤에서 표지가 넘어가면서
       * 창까지 함께 사라진다.
       */
      if (document.querySelector('[role="dialog"]')) return
      if (e.key === 'ArrowLeft') goToPage(pageIndex - 1)
      // 넘김 버튼과 같은 규칙이어야 한다 — 방향키만 서명을 건너뛸 수 있으면 안 된다
      if (e.key === 'ArrowRight' && !needsSignature) goToPage(pageIndex + 1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [phase, isMobile, pageIndex, goToPage, needsSignature])

  // 채점 중 화면을 3초 보여 준 뒤 성적표로 넘긴다
  useEffect(() => {
    if (phase !== 'grading') return
    const timer = window.setTimeout(() => setPhase('result'), GRADING_MS)
    return () => window.clearTimeout(timer)
  }, [phase])

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
    if (isMobile || phase !== 'exam') return

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
  }, [isMobile, phase])

  if (phase === 'grading') {
    return <div className="h-full min-h-0 overflow-hidden"><GradingOverlay /></div>
  }

  if (phase === 'result' && score) {
    return (
      <div className="h-full min-h-0 overflow-hidden">
        <ResultView exam={exam} examinee={examinee} score={score} />
      </div>
    )
  }

  if (isMobile) {
    return (
      <div className="h-full min-h-0 overflow-hidden">
        <MobileExamView
          exam={exam}
          answers={answers}
          examinee={examinee}
          onSelect={onSelect}
          onSubmit={onSubmit}
          onSignatureChange={onSignatureChange}
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
          {/*
            transform: scale 이 아니라 zoom 이다.
            scale 은 11.5px 로 조판한 글자를 늘리는 것이라 획이 픽셀 격자에 어긋나 번진다
            (조선신명조처럼 가로획이 얇은 명조에서 특히 자글자글해진다).
            zoom 은 처음부터 확대된 크기로 조판하므로 획이 픽셀에 맞는다.
          */}
          <div className="flex shrink-0 flex-col">
            <div style={{ zoom: scale }}>
              <ExamSheet
                exam={exam}
                answers={answers}
                examinee={examinee}
                onSelect={onSelect}
                onSubmit={onSubmit}
                onSignatureChange={onSignatureChange}
                pageIndex={pageIndex}
                onPageCount={onPageCount}
              />
            </div>
          </div>
        </div>
      </div>
      {/* 화면 좌우에 고정된다 — 스테이지 안이 아니라 여기 둬야 스크롤과 무관해진다 */}
      <PageNav
        index={pageIndex}
        total={totalPages}
        onChange={goToPage}
        needsSignature={needsSignature}
      />
    </div>
  )
}
