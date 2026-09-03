import type { Answers, Examinee } from './types/exam'

/**
 * 제출한 응시 기록의 보관 — 결과 페이지(`/?done`)가 새로고침·뒤로가기를 견디게 한다.
 *
 * 저장하는 것은 **제출 순간의 것뿐이다.** 풀던 도중의 답안은 담지 않는다 —
 * 시험 중 새로고침은 예나 지금이나 처음부터다. 채점 결과(점수·등급)도 담지 않는다.
 * 답안과 문제지가 있으면 `gradeExam` 이 언제든 같은 값을 다시 낸다. 굳이 넣으면
 * 문항 배점을 고쳤을 때 저장된 점수와 다시 채점한 점수가 어긋난다.
 *
 * `sessionStorage` 인 것은 이 기록의 수명이 **탭 하나**이기 때문이다. 탭을 닫으면
 * 지워지는 것이 맞다 — 공용 PC 에서 앞사람 성적표가 남아 있으면 곤란하고,
 * 새 탭으로 여는 것은 새로 응시하겠다는 뜻이다.
 */

/** 저장 열쇠 — 형식을 바꾸면 뒤의 숫자를 올린다. 옛 기록은 읽히지 않고 버려진다 */
const KEY = 'exam:submission:v1'

export interface Submission {
  answers: Answers
  examinee: Examinee
}

/**
 * 저장은 실패할 수 있다 — 사파리 사생활 보호 모드, 저장 용량 초과(서명 PNG 가
 * dataURL 이라 수십 KB 를 먹는다), 저장소를 막아 둔 브라우저. 어느 쪽이든
 * **응시를 막을 이유는 못 된다.** 실패하면 조용히 지나가고, 그 탭에서는
 * 새로고침하면 결과가 사라지는 예전 동작으로 돌아갈 뿐이다.
 */
export function saveSubmission(submission: Submission): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(submission))
  } catch {
    // 저장 못 해도 그대로 진행한다
  }
}

/** 저장된 응시 기록 — 없거나 깨졌으면 null */
export function loadSubmission(): Submission | null {
  let raw: string | null = null
  try {
    raw = sessionStorage.getItem(KEY)
  } catch {
    return null
  }
  if (!raw) return null

  try {
    const parsed: unknown = JSON.parse(raw)
    return isSubmission(parsed) ? parsed : null
  } catch {
    // 남의 손이 닿았거나 형식이 바뀐 기록 — 없는 것으로 친다
    return null
  }
}

/**
 * 읽어 들인 것을 믿지 않고 한 겹 확인한다 — `sessionStorage` 는 사용자가 직접
 * 고칠 수 있는 자리다. 모양이 어긋나면 통째로 버리고 처음부터 응시하게 둔다.
 */
function isSubmission(value: unknown): value is Submission {
  if (typeof value !== 'object' || value === null) return false
  const { answers, examinee } = value as Record<string, unknown>

  if (typeof answers !== 'object' || answers === null) return false
  // 답안은 { 문항번호: 1~5 } 뿐이다
  for (const choice of Object.values(answers as Record<string, unknown>)) {
    if (typeof choice !== 'number' || !Number.isInteger(choice)) return false
    if (choice < 1 || choice > 5) return false
  }

  if (typeof examinee !== 'object' || examinee === null) return false
  const { signature, id, takenAt } = examinee as Record<string, unknown>
  if (signature !== null && typeof signature !== 'string') return false
  if (typeof id !== 'string' || typeof takenAt !== 'string') return false

  return true
}
