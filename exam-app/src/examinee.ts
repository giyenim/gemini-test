import type { Examinee } from './types/exam'

/**
 * 수험 번호 발급.
 *
 * 8자리다 — 시험지·표지의 기입 칸이 4자리–4자리라 그 칸에 한 글자씩 들어간다.
 * 나중에 응시 기록을 서버에 남길 때 **이 번호를 응시 건의 식별자로 쓴다.**
 *
 * 앞 4자리는 `EPOCH` 이후 경과 초를 10000 으로 나눈 나머지(약 2.8시간 주기),
 * 뒤 4자리는 난수다.
 *
 * 자릿수를 어떻게 나누든 전체 공간은 10⁸ 로 같지만, **난수 쪽을 넉넉히 두어야 같은 순간에
 * 몰릴 때 버틴다.** 난수가 3자리였을 때는 같은 초에 들어온 1만 명이 1000개 번호로 뭉쳤다.
 * 4자리면 같은 초라도 10000 갈래로 흩어진다.
 *
 * **클라이언트만으로는 유일성을 보장할 수 없다.** 10⁸ 공간에서는 생일 문제 때문에 응시자가
 * 1만 명이면 충돌이 한 번쯤 나온다. DB 를 붙일 때 이 컬럼에 **unique 제약을 걸고, 충돌하면
 * 다시 발급해 재시도**하는 처리를 서버에 둔다. 이 함수는 그 재시도 횟수를 줄여 줄 뿐이다.
 */

/** 번호의 기준 시각 — 바꾸면 기존 번호와 규칙이 어긋난다 */
const EPOCH = Date.UTC(2026, 0, 1)

const TIME_DIGITS = 4
const RANDOM_DIGITS = 4

function randomDigits(count: number): string {
  const max = 10 ** count
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return String(buf[0] % max).padStart(count, '0')
}

export function issueExamineeId(now: Date = new Date()): string {
  const seconds = Math.floor((now.getTime() - EPOCH) / 1000)
  const cycle = 10 ** TIME_DIGITS
  // EPOCH 이전이어도 음수가 나오지 않게 한 번 더 더한다
  const time = (((seconds % cycle) + cycle) % cycle).toString().padStart(TIME_DIGITS, '0')
  return time + randomDigits(RANDOM_DIGITS)
}

/** 응시자 발급 — 서명은 표지에서 직접 쓰므로 처음에는 비어 있다 */
export function issueExaminee(now: Date = new Date()): Examinee {
  return {
    signature: null,
    id: issueExamineeId(now),
    takenAt: `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`,
  }
}
