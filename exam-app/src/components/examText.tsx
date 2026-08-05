import type { ReactNode } from 'react'

/**
 * 시험지 본문 텍스트.
 * 지금은 그대로 렌더한다. 특정 어구에 테두리를 씌워야 할 일이 생기면
 * 여기에서만 규칙을 정의한다 (ExamSheet의 측정용 DOM 생성과 짝을 맞출 것).
 */
export function highlightTerms(text: string): ReactNode[] {
  return [text]
}
