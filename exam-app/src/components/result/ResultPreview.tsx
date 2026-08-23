import { useMemo } from 'react'
import examData from '../../data/exam-sample.json'
import { gradeExam } from '../../grade'
import type { Answers, ChoiceIndex, ExamData, Examinee } from '../../types/exam'
import { GradingOverlay } from './GradingOverlay'
import { ResultView } from './ResultView'

/**
 * 성적표 미리보기 — 주소에 `?result` 를 붙이면 **표지·시험지·채점을 건너뛰고**
 * 이 화면부터 열린다 (`main.tsx` 가 가른다). 결과 화면만 고칠 때 스무 문제를
 * 찍고 3초를 기다리는 길을 매번 되밟지 않으려고 둔다. UI 킷의 `?ui` 와 같은 자리다.
 *
 *   ?result           13 문항 정답 (7 오답 · 그중 하나는 미선택)
 *   ?result=17        17 문항 정답
 *   ?result=perfect   만점 — 오답노트가 잠긴 모습
 *   ?result=0         0 점
 *   ?result=grading   채점 중 화면 (3초 뒤 넘어가지 않고 그대로 머문다)
 *
 * 이 파일은 개발용이라 `App` 의 흐름에는 끼지 않는다. 화면에 그려지는 것은
 * 실제 `ResultView` 그대로이므로, 여기서 고친 것이 곧 응시자가 보는 것이다.
 */

const exam = examData as unknown as ExamData

/** 기본 정답 수 — 오답노트에 넘길 것이 남고 만점도 아닌, 가장 흔한 성적 */
const DEFAULT_CORRECT = 13

/**
 * 서명 견본 — 성적표는 표지에서 쓴 글씨를 그대로 안고 오므로, 빈 칸으로 두면
 * 이름 자리의 균형을 볼 수 없다. 손으로 쓴 획 비슷하게 한 번에 그려 둔다.
 */
function sampleSignature(): string {
  const canvas = document.createElement('canvas')
  canvas.width = 320
  canvas.height = 88
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  ctx.strokeStyle = '#111'
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(24, 62)
  ctx.bezierCurveTo(58, 14, 84, 78, 116, 40)
  ctx.bezierCurveTo(140, 12, 150, 70, 178, 52)
  ctx.bezierCurveTo(206, 34, 214, 74, 248, 44)
  ctx.bezierCurveTo(268, 26, 286, 40, 300, 30)
  ctx.stroke()

  return canvas.toDataURL('image/png')
}

/** 채점 결과를 만든다 — 앞에서부터 `correct` 개를 맞히고, 나머지는 틀린 답으로 채운다 */
function buildAnswers(correct: number): Answers {
  const answers: Answers = {}
  exam.questions.forEach((question, i) => {
    if (i < correct) {
      answers[question.id] = question.answer
      return
    }
    // 마지막 한 문항은 비워 둔다 — 채점표·오답노트의 `—`(미선택) 자리를 보려고
    if (i === exam.questions.length - 1) return
    answers[question.id] = (((question.answer % 5) + 1) as ChoiceIndex)
  })
  return answers
}

/** `?result=` 뒤의 값 → 맞힌 문항 수 */
function correctCountFrom(value: string): number {
  if (value === 'perfect') return exam.questions.length
  const n = Number(value)
  return value !== '' && Number.isFinite(n)
    ? Math.max(0, Math.min(exam.questions.length, Math.trunc(n)))
    : DEFAULT_CORRECT
}

export function ResultPreview({ value }: { value: string }) {
  const examinee = useMemo<Examinee>(
    () => ({
      signature: sampleSignature(),
      id: '20260823',
      takenAt: '2026년 8월 23일',
    }),
    [],
  )

  const score = useMemo(
    () => gradeExam(exam, buildAnswers(correctCountFrom(value))),
    [value],
  )

  if (value === 'grading') {
    return (
      <div className="h-full min-h-0 overflow-hidden">
        <GradingOverlay />
      </div>
    )
  }

  return (
    <div className="h-full min-h-0 overflow-hidden">
      <ResultView exam={exam} examinee={examinee} score={score} />
    </div>
  )
}
