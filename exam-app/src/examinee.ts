import type { Examinee } from './types/exam'

/**
 * 수험 번호 발급 — 8자리 (기입 칸이 4자리–4자리다).
 * 앞 4자리는 `EPOCH` 이후 경과 초의 나머지, 뒤 4자리는 난수 — 같은 초에 몰려도 흩어진다.
 *
 * 클라이언트만으로는 유일성을 보장할 수 없다 (10⁸ 공간은 응시자 1만 명이면 충돌이
 * 한 번쯤 나온다). DB 를 붙일 때 unique 제약 + 충돌 시 재발급을 서버에 둔다 —
 * 이 함수는 그 재시도 횟수를 줄여 줄 뿐이다.
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
