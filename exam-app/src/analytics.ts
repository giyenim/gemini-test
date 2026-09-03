/**
 * 응시 지표 수집 — **임시.** 마케팅 캠페인이 끝나면 걷어낸다.
 *
 * 이 파일과 호출부 몇 줄이 전부다. 뗄 때는 이 파일을 지우고 `track*` 호출을
 * 지우면 끝난다 (`ANALYTICS-REQUEST.md` §7, `ANALYTICS-READY.md` §11).
 *
 *
 * 무엇을 보내나
 *
 * 응시자가 **어디까지 풀다 그만뒀는지**를 알고 싶다. 이탈은 관측할 수 없는
 * 사건이라 — 탭을 닫을 때 브라우저가 알려 주지 않는다 — "떠났다"를 잡으려 하지
 * 않고, **가장 멀리 간 지점을 계속 갱신해 두고 마지막 기록을 이탈 지점으로 읽는다.**
 *
 *
 * 언제 보내나 — 세션당 1~3회
 *
 * 넘길 때마다 보내면 세션당 스무 번이 넘는다. 그래서 진행 상황은 **여기 쌓아만
 * 두고**, 화면을 벗어날 때(`visibilitychange`) 한 번에 보낸다. 모바일에서 가장
 * 믿을 만한 신호다 — 홈 버튼을 누르든 앱을 전환하든 잡힌다.
 *
 * 제출만은 그 자리에서 즉시 한 번 더 보낸다. 가장 중요한 기록이라 유실을 피한다.
 *
 *
 * 이 파일이 지켜야 할 것
 *
 * **응시를 방해하지 않는다.** 지표 수집이 시험을 막으면 본말이 전도된다.
 * 그래서 모든 실패를 삼킨다 — 서버가 죽어 있든, 저장소가 막혀 있든, 네트워크가
 * 끊겼든 응시자는 아무것도 눈치채지 못해야 한다.
 */

import type { ExamScore } from './grade'
import { MOBILE_MEDIA_QUERY } from './layout/constants'

/**
 * 수집 창구 — `yes24-IT-best` 대시보드에 얹은 라우트 (ANALYTICS-READY.md §1).
 * 허용된 출처는 이 앱의 도메인과 `http://localhost:5173` 둘뿐이다.
 */
const ENDPOINT = 'https://yes24-it-best.vercel.app/api/exam-events'

/** 세션 열쇠 — 성적표 기록(`session.ts`)과 같은 자리에 두되 이름을 가른다 */
const SESSION_KEY = 'exam:analytics:sid'

/** 클릭으로 셀 것 — 서버가 아는 값만 보낸다. 모르는 것은 서버가 걸러 낸다 */
export type ClickTarget = 'book' | 'share' | 'score_table' | 'wrong_note'

interface Payload {
  session_id: string
  device: 'mobile' | 'pc'
  referrer?: string
  started?: boolean
  furthest?: number
  submitted?: boolean
  score?: number
  grade?: number
  answered?: number
  correct?: boolean[]
  exam_no?: string
  clicks?: ClickTarget[]
}

/**
 * 브라우저에 쌓아 두는 것. 보내지 않은 진행 상황이 여기 머문다.
 *
 * `device` 를 처음 한 번만 정하는 것은, 창 크기를 바꿔 판정이 뒤집혀도 한 응시가
 * 두 기기로 갈리지 않게 하기 위해서다. 서버도 첫 값을 지키지만 보내는 쪽도
 * 일관된 편이 헷갈리지 않는다 (ANALYTICS-READY.md §8).
 */
const state = {
  furthest: 0,
  started: false,
  clicks: new Set<ClickTarget>(),
  /** 마지막으로 보낸 뒤 달라진 것이 있는가 — 없으면 보내지 않는다 */
  dirty: false,
}

/**
 * 세션 번호 — 한 응시에 하나. `sessionStorage` 라 탭을 닫으면 사라진다.
 *
 * 매번 새로 만들면 한 사람이 여러 줄이 되어 "줄 수 = 응시자 수"가 깨진다
 * (ANALYTICS-READY.md §8). 그래서 한 번 만든 것을 탭이 사는 동안 계속 쓴다.
 *
 * `randomUUID` 의 하이픈은 서버 규칙(`[A-Za-z0-9_-]{8,64}`)이 허용한다.
 */
function sessionId(): string {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY)
    if (saved) return saved
    const fresh = crypto.randomUUID()
    sessionStorage.setItem(SESSION_KEY, fresh)
    return fresh
  } catch {
    // 저장소가 막힌 브라우저 — 이 탭에서는 갱신이 새 줄로 갈린다.
    // 지표가 조금 부정확해질 뿐, 응시를 막을 이유는 못 된다.
    return crypto.randomUUID()
  }
}

let cachedDevice: 'mobile' | 'pc' | null = null

function device(): 'mobile' | 'pc' {
  if (cachedDevice) return cachedDevice
  cachedDevice = window.matchMedia(MOBILE_MEDIA_QUERY).matches ? 'mobile' : 'pc'
  return cachedDevice
}

/**
 * 유입 경로 — `?from=instagram` 처럼 붙여 온 값.
 *
 * 주소에서 읽되 지우지는 않는다. 이 앱은 주소를 화면 상태로도 쓰므로
 * (`route.ts`) 여기서 손대면 그쪽과 다툰다.
 */
function referrer(): string | undefined {
  try {
    return new URLSearchParams(window.location.search).get('from') ?? undefined
  } catch {
    return undefined
  }
}

/**
 * 보내기. **던지지 않는다** — 실패는 전부 삼킨다.
 *
 * `beacon` 은 탭이 닫히는 순간에도 브라우저가 대신 보내 준다. 다만 보냈는지
 * 확인할 길이 없어, 꼭 남아야 하는 제출은 `fetch` 로 보낸다.
 */
function send(payload: Payload, useBeacon: boolean): void {
  try {
    const body = JSON.stringify(payload)

    if (useBeacon && typeof navigator.sendBeacon === 'function') {
      // Blob 없이 문자열로 보내면 Content-Type 이 text/plain 이 된다 — 서버가 받는다
      navigator.sendBeacon(ENDPOINT, body)
      return
    }

    void fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      // 화면이 넘어가는 중에도 요청이 살아남게 한다
      keepalive: true,
    }).catch(() => {})
  } catch {
    // 직렬화 실패·API 부재 — 어느 쪽이든 응시는 계속된다
  }
}

/** 쌓아 둔 진행 상황을 보낸다. 달라진 것이 없으면 아무 일도 하지 않는다 */
function flush(useBeacon = true): void {
  if (!state.dirty) return
  state.dirty = false

  send(
    {
      session_id: sessionId(),
      device: device(),
      referrer: referrer(),
      started: state.started,
      furthest: state.furthest,
      clicks: [...state.clicks],
    },
    useBeacon,
  )
}

/**
 * 표지가 열렸다 — 응시 흐름의 시작.
 *
 * 여기서 곧바로 보내지 않는다. 표지만 보고 나간 사람도 `visibilitychange` 에서
 * 한 줄이 남으므로, 열자마자 요청을 하나 더 쓸 이유가 없다.
 */
export function trackOpen(): void {
  state.dirty = true
}

/** 표지에서 이름을 썼다 — 여기부터가 "시작한 사람"이다 */
export function trackStart(): void {
  if (state.started) return
  state.started = true
  state.dirty = true
}

/**
 * 어디까지 갔는가. **큰 값만 남긴다** — 뒤로 돌아간 것은 이탈 지점이 아니다.
 *
 * 뜻이 기기마다 다르다 (ANALYTICS-REQUEST.md §3-2):
 *   모바일 — 문항 번호 (1문제 1페이지라 문항이 곧 쪽이다)
 *   PC     — 쪽 번호 (0=표지, 1~4=문제지)
 */
export function trackFurthest(point: number): void {
  if (!Number.isFinite(point) || point <= state.furthest) return
  state.furthest = Math.trunc(point)
  state.dirty = true
}

/** 성적표의 링크·버튼을 눌렀다 */
export function trackClick(target: ClickTarget): void {
  if (state.clicks.has(target)) return
  state.clicks.add(target)
  state.dirty = true
}

/**
 * 제출했다 — **즉시 보낸다.**
 *
 * 가장 중요한 기록이라 `visibilitychange` 를 기다리지 않는다. 그 사이 브라우저가
 * 죽으면 완주 기록이 통째로 사라진다.
 *
 * `beacon` 이 아니라 `fetch` 인 것은, 이 순간에는 화면이 살아 있어 요청을 끝까지
 * 끌고 갈 수 있기 때문이다 (ANALYTICS-READY.md §8).
 */
export function trackSubmit(score: ExamScore, examNo: string): void {
  state.dirty = false

  send(
    {
      session_id: sessionId(),
      device: device(),
      referrer: referrer(),
      started: true,
      // 제출까지 왔으면 끝까지 간 것이다
      furthest: Math.max(state.furthest, device() === 'mobile' ? 20 : 4),
      submitted: true,
      score: score.earned,
      grade: score.grade,
      answered: score.results.filter((r) => r.selected !== null).length,
      correct: score.results.map((r) => r.correct),
      exam_no: examNo,
      clicks: [...state.clicks],
    },
    false,
  )
}

/**
 * 화면을 벗어날 때 보낸다 — 이 한 번이 이탈 지점을 남긴다.
 *
 * `visibilitychange` 만으로 충분하지 않은 브라우저가 있어 `pagehide` 도 함께 듣는다.
 * 둘 다 와도 `dirty` 가 막아 주므로 요청이 겹치지 않는다.
 */
export function startAnalytics(): () => void {
  const onHide = () => {
    if (document.visibilityState === 'hidden') flush()
  }
  const onPageHide = () => flush()

  document.addEventListener('visibilitychange', onHide)
  window.addEventListener('pagehide', onPageHide)

  return () => {
    document.removeEventListener('visibilitychange', onHide)
    window.removeEventListener('pagehide', onPageHide)
  }
}
