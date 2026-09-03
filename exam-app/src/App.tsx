import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import examData from './data/exam-sample.json'
import { ExamSheet } from './components/ExamSheet'
import { MobileExamView } from './components/MobileExamView'
import { PageNav } from './components/PageNav'
import { GRADING_MS } from './components/result/constants'
import { GradingOverlay } from './components/result/GradingOverlay'
import { ResultView } from './components/result/ResultView'
import {
  startAnalytics,
  trackFurthest,
  trackOpen,
  trackStart,
  trackSubmit,
} from './analytics'
import { issueExaminee } from './examinee'
import { gradeExam } from './grade'
import { openSignatureField } from './components/signatureField'
import { MOBILE_MEDIA_QUERY, PAGE_W } from './layout/constants'
import { pushResult, replaceExam, routeOf } from './route'
import { loadSubmission, saveSubmission } from './session'
import type { Answers, ChoiceIndex, ExamData, Examinee } from './types/exam'

// JSON 리터럴은 문자열 유니온·튜플로 좁혀지지 않으므로 한 번에 단언한다
const exam = examData as unknown as ExamData

/**
 * 시험지 최대 배율 — 화면이 넓으면 이 값까지 키우고, 좁으면 폭에 맞춰 줄인다.
 *
 * **1 = 확대하지 않는다.** 시험지를 조판한 크기(842×1191) 그대로 보여 준다.
 * 그래야 시험지 위의 것과 시험지 밖의 것(쪽 넘김 버튼)이 같은 자로 재진다 —
 * 확대를 걸면 안쪽만 커져서 제출 버튼의 글자·점·획을 따로 되나눠야 했다.
 */
const SHEET_ZOOM = 1

/** 바깥 여백(스테이지 패딩) — 폭이 줄면 스케일보다 여백이 먼저 줄어듦 */
const PAD_MAX = 24
const PAD_MIN = 0

/** 응시 흐름 — 표지 → 시험 → 채점 중 → 성적표. 되돌아가는 길은 없다 (RESULT-PAGE.md) */
type Phase = 'exam' | 'grading' | 'result'

/**
 * 첫 화면 — **주소가 정한다.**
 *
 * `/?done` 이면 성적표, 아니면 새 시험지다. 저장된 기록은 성적표를 그릴 재료일 뿐
 * 어느 화면을 열지는 정하지 않는다. 그래서 시험 주소로 오면 낸 기록이 남아 있어도
 * 늘 새 시험지가 열린다 — 뒤로가기로 물러났든, 링크를 다시 눌렀든 같다.
 *
 * 기록을 **지우지는 않는다.** 지워 버리면 그 자리에서 앞으로가기를 눌렀을 때
 * 되살릴 것이 없어 성적표가 영영 사라진다. 새 시험을 시작하되 낸 것은 남겨 둬야
 * 앞으로가기로 성적표에 돌아올 수 있다. 기록은 다음 제출이 덮어쓴다.
 *
 * `채점 중`(3초)은 되살리지 않는다. 지나가는 연출이라 되감을 것이 없고,
 * 새로고침한 사람을 3초 더 세워 둘 이유도 없다 — 곧장 성적표를 편다.
 */
function initialState(): { phase: Phase; answers: Answers; examinee: Examinee } {
  const fresh = (): { phase: Phase; answers: Answers; examinee: Examinee } =>
    // 표지를 여는 순간이 곧 응시 시작이다
    ({ phase: 'exam', answers: {}, examinee: issueExaminee() })

  if (routeOf() === 'result') {
    const saved = loadSubmission()
    if (saved) {
      return { phase: 'result', answers: saved.answers, examinee: saved.examinee }
    }
    /*
      낸 기록이 없는데 주소만 `/?done` 이다 — 남이 보내 준 결과 링크를 열었거나,
      탭을 닫았다 되연 경우다. 남의 성적표를 대신 보여 줄 수는 없으니 시험 주소로
      갈아 끼우고 처음부터 응시하게 한다.
    */
    replaceExam()
  }

  return fresh()
}

export default function App() {
  /* 세 값이 한 몸이라 한 번에 정한다 — 저장된 기록을 복원할 때 답안·응시자·단계가
     따로 놀면 남의 답안에 새 수험 번호가 붙는 식으로 어긋난다 */
  const [initial] = useState(initialState)
  const [answers, setAnswers] = useState<Answers>(initial.answers)
  const [examinee, setExaminee] = useState<Examinee>(initial.examinee)
  const [phase, setPhase] = useState<Phase>(initial.phase)
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
    // 이름을 쓴 것이 곧 응시 시작이다 — 여기부터가 지표의 "시작한 사람"
    if (signature) trackStart()
    setExaminee((prev) => ({ ...prev, signature }))
  }, [])

  const goToPage = useCallback((next: number) => {
    setPageIndex((prev) => {
      const clamped = Math.min(totalPagesRef.current - 1, Math.max(0, next))
      if (clamped !== prev) stageScrollRef.current?.scrollTo({ top: 0 })
      // 지표 — PC 는 쪽 번호가 도달 지점이다 (0=표지, 1~4=문제지)
      trackFurthest(clamped)
      return clamped
    })
  }, [])

  /**
   * 제출 — 낸 답을 갈무리하고 결과 주소로 넘어간다.
   *
   * 저장과 주소 바꾸기를 `채점 중`으로 넘어가는 이 자리에서 함께 한다. 3초 뒤
   * 성적표가 뜰 때까지 미루면, 그 사이 새로고침한 사람의 답안이 통째로 날아간다.
   */
  const onSubmit = useCallback(() => {
    saveSubmission({ answers, examinee })
    // 지표 — 제출은 가장 중요한 기록이라 이 자리에서 즉시 보낸다 (analytics.ts)
    trackSubmit(gradeExam(exam, answers), examinee.id)
    pushResult()
    setPhase('grading')
  }, [answers, examinee])

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
      // 서명 창이 떠 있는 동안은 넘기지 않는다 — 창 뒤에서 표지가 넘어가며 창까지 사라진다
      if (document.querySelector('[role="dialog"]')) return
      if (e.key === 'ArrowLeft') goToPage(pageIndex - 1)
      // 넘김 버튼과 같은 규칙이어야 한다 — 방향키만 서명을 건너뛸 수 있으면 안 된다
      if (e.key === 'ArrowRight' && !needsSignature) goToPage(pageIndex + 1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [phase, isMobile, pageIndex, goToPage, needsSignature])

  /*
   * 모바일에서 표지가 뜨면 **성명 칸을 대신 눌러 준다.**
   *
   * 데스크톱은 넘김 버튼이 서명 전이면 이 칸을 대신 누르지만(`PageNav`), 모바일은
   * 스와이프로 넘겨 그 길이 없다. 칸이 표지 안에 조용히 앉아 있어 그냥 지나치고,
   * 이름 없이 시험을 치르게 된다. 그래서 열자마자 창을 띄워 먼저 묻는다.
   *
   * 이미 서명했으면 열지 않는다 — 뒤로가기로 표지에 돌아왔을 때 창이 다시 뜨면
   * 지운 적 없는 이름을 또 쓰라는 말이 된다.
   *
   * 표지가 그려진 **뒤에** 눌러야 한다. `openSignatureField` 는 DOM 에서 칸을 찾아
   * 누르는데, 이 효과는 첫 그림과 같은 차례에 돌아 아직 칸이 없다.
   */
  useEffect(() => {
    if (!isMobile || phase !== 'exam' || pageIndex !== 0) return
    if (examinee.signature) return
    const t = window.setTimeout(openSignatureField, 0)
    return () => window.clearTimeout(t)
  }, [isMobile, phase, pageIndex, examinee.signature])

  /* 지표 — 표지가 열렸다. 들어온 사실을 곧바로 보내고, 이후는 쌓아 두었다 벗어날 때 보낸다 */
  useEffect(() => {
    trackOpen()
    return startAnalytics()
  }, [])

  /**
   * 뒤로가기·앞으로가기 — 주소를 따라 화면을 갈아 끼운다.
   *
   * 결과에서 뒤로 물러나면 **새 시험지**가 열리고, 거기서 앞으로가기를 누르면 낸
   * 기록으로 성적표가 다시 선다. 기록을 지우지 않고 두는 것이 이 왕복을 가능하게 한다.
   *
   * 첫 화면을 정하는 규칙(`initialState`)과 같은 규칙이어야 한다 — 새로고침해서 온
   * 사람과 뒤로가기로 온 사람이 같은 주소에서 다른 화면을 보면 안 된다.
   */
  useEffect(() => {
    const onPop = () => {
      if (routeOf() === 'result') {
        const saved = loadSubmission()
        // 앞으로가기로 결과에 돌아왔다 — `채점 중`은 건너뛰고 성적표를 편다
        if (saved) {
          setAnswers(saved.answers)
          setExaminee(saved.examinee)
          setPhase('result')
        }
        return
      }
      /* 시험 주소로 물러났다 — 낸 기록이 남아 있어도 새 시험지를 편다.
         답안·수험 번호를 새로 발급해야 앞 응시의 흔적이 딸려 오지 않는다 */
      setAnswers({})
      setExaminee(issueExaminee())
      setPageIndex(0)
      setPhase('exam')
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

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
          {/* scale 이 아니라 zoom — scale 은 확대 시 획이 번진다 (LAYOUT.md "화면 배율") */}
          {/*
            세로 가운데. `items-center` 가 아니라 `m-auto` 인 것은, 시험지가 화면보다
            길 때 `items-center` 는 위쪽을 스크롤로 닿을 수 없게 잘라 먹기 때문이다.
            auto 여백은 남는 자리가 없으면 0 이 되어 그런 일이 없다.
          */}
          <div className="m-auto flex shrink-0 flex-col">
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
