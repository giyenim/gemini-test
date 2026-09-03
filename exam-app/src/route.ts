/**
 * 주소 두 자리 — 시험(`/`)과 결과(`/?done`).
 *
 * 라우터 라이브러리를 들이지 않고 History API 만 쓴다. 자리가 둘뿐이고 중첩도
 * 파라미터도 없다. 경로(`/result`)가 아니라 **쿼리**인 것은 GitHub Pages 가 정적
 * 파일만 내주기 때문이다 — `/result` 로 직접 들어오면 그런 파일이 없어 404 가 난다.
 * 쿼리는 어느 정적 호스팅에서나 `index.html` 로 그대로 떨어진다.
 */

/** 결과 화면을 가리키는 쿼리 키 — `/?done` */
const DONE = 'done'

export type Route = 'exam' | 'result'

export function routeOf(search: string = window.location.search): Route {
  return new URLSearchParams(search).has(DONE) ? 'result' : 'exam'
}

/**
 * 결과 화면으로 **밀어 넣는다**(push). replace 가 아닌 것은 성적표가 방문 기록에
 * 제 칸을 가져야 하기 때문이다 — 뒤로가면 새 시험지, 다시 앞으로가면 성적표다.
 */
export function pushResult(): void {
  window.history.pushState(null, '', `?${DONE}`)
}

/**
 * 시험 주소로 **갈아 끼운다**(replace). 되살릴 기록도 없이 `/?done` 으로 들어온
 * 주소를 바로잡을 때 쓴다 — 방문 기록에 빈 성적표 자리를 남기지 않는다.
 */
export function replaceExam(): void {
  window.history.replaceState(null, '', window.location.pathname)
}
