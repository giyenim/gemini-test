import type { Answers, ChoiceIndex, ExamData } from './types/exam'

/**
 * 기준 분포 — 원점수 모집단의 평균·표준편차.
 *
 * [RESULT-PAGE.md](../RESULT-PAGE.md) §2 는 **실제 응시 기록**으로 백분위를 내는 것을
 * 전제하지만 아직 서버가 없다. 그때까지는 이 분포로 대신 계산한다. 서버가 붙으면
 * 이 두 값을 실제 통계로 갈아끼우면 되고, 표본이 모자랄 때의 대체값으로도 그대로 쓴다.
 *
 * 50점 만점에 평균 30점(60%)·표준편차 9점을 가정했다. 근거가 되는 응시 데이터는 없다.
 *
 * **이 값으로 간다 (2026-09-03 결정).** 지표 수집(`analytics.ts`)이 제출마다 원점수를
 * 남기고 있어 실제 분포를 낼 수는 있지만, 그것으로 갈아끼우지 않기로 했다.
 *
 * 응시자가 적을 때 실제 분포를 쓰면 등급이 표본을 따라 출렁인다 — 같은 점수가 어제는
 * 3등급, 오늘은 5등급이 된다. 성적표는 캡처되어 공유되는 물건이라 그 흔들림이 곧
 * 신뢰를 깎는다. 고정값은 근거가 없는 대신 **누구에게나 같은 자를 댄다.**
 */
export const BASE_MEAN = 30
export const BASE_SD = 9

/**
 * 등급별 누적 상위 비율 (수능과 같은 기준).
 * 1등급 상위 4% → 백분위 96 이상, 2등급 상위 11% → 89 이상 …
 */
const GRADE_CUTS = [96, 89, 77, 60, 40, 23, 11, 4]

export interface QuestionResult {
  id: number
  points: number
  answer: ChoiceIndex
  /** 고르지 않았으면 null — 찍어서 틀린 것과 구분한다 */
  selected: ChoiceIndex | null
  correct: boolean
}

export interface ExamScore {
  earned: number
  max: number
  /** 표준점수 — 수능과 같은 식으로 20z + 100 */
  standard: number
  /** 백분위 1~99 */
  percentile: number
  /** 등급 1~9 */
  grade: number
  results: QuestionResult[]
  /** 틀린 문항만 (미선택 포함) — 오답노트가 이 순서로 넘긴다 */
  wrong: QuestionResult[]
}

/** 표준정규분포 누적확률. Abramowitz & Stegun 7.1.26 오차함수 근사 */
function normalCdf(z: number): number {
  const sign = z < 0 ? -1 : 1
  const x = Math.abs(z) / Math.SQRT2
  const t = 1 / (1 + 0.3275911 * x)
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t *
      Math.exp(-x * x)
  return 0.5 * (1 + sign * y)
}

function gradeOf(percentile: number): number {
  const index = GRADE_CUTS.findIndex((cut) => percentile >= cut)
  return index === -1 ? 9 : index + 1
}

/** 제출 답안 채점 — 미선택·오답은 0점 */
export function gradeExam(exam: ExamData, answers: Answers): ExamScore {
  let earned = 0
  let max = 0
  const results: QuestionResult[] = []

  for (const question of exam.questions) {
    max += question.points
    const selected = answers[question.id] ?? null
    const correct = selected === question.answer
    if (correct) earned += question.points
    results.push({
      id: question.id,
      points: question.points,
      answer: question.answer,
      selected,
      correct,
    })
  }

  const z = (earned - BASE_MEAN) / BASE_SD
  // 만점이어도 100, 0점이어도 0 이 되지 않게 1~99 로 자른다 (수능 백분위와 같다)
  const percentile = Math.min(99, Math.max(1, Math.round(normalCdf(z) * 100)))

  return {
    earned,
    max,
    standard: Math.round(20 * z + 100),
    percentile,
    grade: gradeOf(percentile),
    results,
    wrong: results.filter((r) => !r.correct),
  }
}
