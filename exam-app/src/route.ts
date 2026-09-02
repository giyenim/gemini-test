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

/**
 * 새로 응시하겠다는 뜻을 담은 쿼리 — `/?new`.
 *
 * 결과 화면에 `다시 응시` 버튼을 두지는 않는다(RESULT-PAGE.md §7 이 제외한 항목이다).
 * 다만 낸 기록이 남은 탭에서 **다시 풀 길 자체가 막히면** 곤란하다 — 새 탭을 열
 * 줄 모르는 사람에게 이 주소가 유일한 출구다. 눈에 띄지 않되 있기는 한 자리로 둔다.
 */
const NEW = 'new'

export type Route = 'exam' | 'result' | 'new'

export function routeOf(search: string = window.location.search): Route {
  const params = new URLSearchParams(search)
  // `?new` 를 먼저 본다 — 새로 풀겠다는 뜻이 저장된 기록보다 앞선다
  if (params.has(NEW)) return 'new'
  return params.has(DONE) ? 'result' : 'exam'
}

/**
 * 결과 화면으로 **밀어 넣는다**(push). 뒤로가기를 누르면 시험 주소로 돌아가는데,
 * 거기서 답을 고쳐 다시 낼 수는 없다 — 저장된 기록이 있으면 App 이 결과로 되돌린다.
 */
export function pushResult(): void {
  window.history.pushState(null, '', `?${DONE}`)
}

/**
 * 결과 주소로 **갈아 끼운다**(replace). 낸 기록이 있어 결과를 되살릴 때 쓴다 —
 * 되살리는 것은 새로 일어난 일이 아니므로 방문 기록을 늘리지 않는다. push 로 두면
 * 뒤로가기를 누를 때마다 같은 자리가 한 칸씩 쌓여 앞 페이지로 나갈 수 없게 된다.
 */
export function replaceResult(): void {
  window.history.replaceState(null, '', `?${DONE}`)
}

/**
 * 시험 주소로 **갈아 끼운다**(replace). 새 시험을 시작할 때 쓴다.
 * push 가 아닌 것은, 여기서 뒤로가기를 누르면 방금 버린 결과 주소로 되돌아가
 * 이미 지운 기록을 찾는 헛걸음이 되기 때문이다.
 */
export function replaceExam(): void {
  window.history.replaceState(null, '', window.location.pathname)
}
