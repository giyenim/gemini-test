import type { Examinee } from './types/exam'

/**
 * 수험 번호 발급 — 8자리 **전부 난수** (기입 칸이 4자리–4자리라 자릿수는 8로 고정이다).
 *
 * 앞 4자리에 응시 시각을 넣던 것을 걷어냈다. 시각이 번호에 드러나면 같은 시간대에
 * 응시한 사람끼리 앞자리가 뭉쳐 서로 비슷해 보이고, 번호만 보고 응시 시각을 역산할
 * 수도 있다. 성적표는 캡처되어 공유되는 물건이라 필요 없는 정보는 담지 않는 편이 낫다.
 *
 * **이 번호로 하는 일은 하나다** — 같은 성적표로 두 번 응모했는지 가려내는 것.
 * 응모를 받는 쪽에서 번호가 같으면 같은 응시, 다르면 다른 응시로 친다.
 *
 * 그 이상은 못 한다. 번호를 만드는 것이 브라우저라서, 홈 링크를 다시 눌러 새 번호를
 * 받거나 캡처 이미지의 숫자를 고치는 것은 막지 못한다. 위조까지 막으려면 서버가
 * 번호를 발급하고 대조해야 한다 (RESULT-PAGE.md §8 "서버").
 *
 * 겹칠 확률은 생일 문제로 따진다 — 10⁸ 공간에서 1,000명이면 0.5%, 5,000명이면 12%,
 * 10,000명이면 39% 로 **어딘가 한 쌍**이 겹친다. 특정 두 사람이 겹칠 확률이 아니라
 * 전체에서 한 번이라도 날 확률이다. 응모자 명단에서 중복을 거르는 용도로는 이 정도면
 * 되지만, 자릿수를 늘려야 할 만큼 규모가 커지면 `ID_DIGITS` 와 기입 칸을 함께 고친다.
 */

/** 번호 자릿수 — 시험지·표지의 기입 칸(4–4)과 맞물려 있다. 바꾸려면 칸도 함께 고친다 */
const ID_DIGITS = 8

/**
 * 0~9 만 쓰는 난수 문자열. `crypto` 가 주는 32비트 값을 10 으로 나눈 나머지로 한 자리씩
 * 뽑는다 — 큰 수 하나를 10ⁿ 으로 나누면 자바스크립트 정수 정밀도(2⁵³)에 눌려 자릿수가
 * 늘어날수록 앞자리가 치우친다.
 *
 * 2³² 는 10 의 배수가 아니라 나머지 연산만으로는 0~5 가 6~9 보다 아주 조금 더 자주
 * 나온다(치우침 약 10⁻⁸). 눈에 보이지도, 중복 확률을 흔들지도 않는 크기라 그대로 둔다.
 */
function randomDigits(count: number): string {
  const buf = new Uint32Array(count)
  crypto.getRandomValues(buf)
  return Array.from(buf, (n) => String(n % 10)).join('')
}

export function issueExamineeId(): string {
  return randomDigits(ID_DIGITS)
}

/**
 * 응시자 발급 — 서명은 표지에서 직접 쓰므로 처음에는 비어 있다.
 * `now` 는 응시일 표기에만 쓴다. 번호는 시각과 무관한 난수다.
 */
export function issueExaminee(now: Date = new Date()): Examinee {
  return {
    signature: null,
    id: issueExamineeId(),
    takenAt: `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`,
  }
}
