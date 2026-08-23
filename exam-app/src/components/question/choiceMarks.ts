import type { ChoiceIndex } from '../../types/exam'

/**
 * 선택지 기호와 판별 — 컴포넌트가 아니라서 `ChoiceGroup.tsx` 밖으로 나왔다.
 * 한 파일이 컴포넌트와 그 밖의 것을 같이 내보내면 Fast Refresh 가 상태를 잃는다
 * (oxlint `react(only-export-components)`).
 */

/** ① ② ③ ④ ⑤ */
export const CHOICE_MARKS = [
  '①',
  '②',
  '③',
  '④',
  '⑤',
] as const

export function choiceMark(n: ChoiceIndex): string {
  return CHOICE_MARKS[n - 1]
}

/**
 * 조합형 선택지 판별 — `ㄱ` `ㄴ, ㄷ` `A, B, C` 처럼 기호만 나열된 형태.
 * 수능 문제지는 이런 선택지를 단 폭 5등분에 가로 한 줄로 펼친다.
 * 서술형 선택지는 세로로 쌓는다.
 */
function isCompactChoice(text: string): boolean {
  return /^[ㄱ-ㅎA-Za-z0-9](\s*,\s*[ㄱ-ㅎA-Za-z0-9])*$/.test(text.trim())
}

export function isCompactChoiceSet(
  choices: readonly string[],
): boolean {
  return choices.every(isCompactChoice)
}
