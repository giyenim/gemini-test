import type { ReactNode } from 'react'

/**
 * 부정 발문 표시 — 수능 문제지는 `옳지 않은 것은?` `아닌 것은?`처럼
 * **부정으로 물어보는 문항의 부정어에만 밑줄**을 긋는다. 놓치면 정반대로 푸는 문항이라
 * 서체·굵기는 그대로 두고 밑줄만 얹는다.
 *
 * 밑줄은 `text-decoration`이라 **글자 높이를 바꾸지 않는다** — 측정/패킹에 영향이 없다.
 */
const NEGATION = /(않은|않는|아닌|없는|틀린|잘못된)/g

/**
 * 시험지 본문 텍스트.
 * 규칙은 여기에서만 정의한다 — 측정용 DOM(`ExamSheet`)과 실제 렌더가
 * 같은 `QuestionBlock`을 쓰므로 이 함수 하나를 고치면 양쪽이 함께 바뀐다.
 */
export function highlightTerms(text: string): ReactNode[] {
  return text.split(NEGATION).map((part, i) =>
    // split의 홀수 번째 조각이 캡처된 부정어다
    i % 2 === 1 ? (
      <u key={i} className="underline decoration-[0.7px] underline-offset-2">
        {part}
      </u>
    ) : (
      part
    ),
  )
}
