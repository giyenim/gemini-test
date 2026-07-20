import type { ChoiceIndex } from '../types/exam'

export const CHOICE_MARKS = ['①', '②', '③', '④', '⑤'] as const

export function choiceMark(n: ChoiceIndex): string {
  return CHOICE_MARKS[n - 1]
}
