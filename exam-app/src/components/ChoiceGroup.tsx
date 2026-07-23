import type { ChoiceIndex } from '../types/exam'
import { CHOICE_MARKS } from '../utils/choices'

interface ChoiceGroupProps {
  questionId: number
  choices: [string, string, string, string, string]
  selected?: ChoiceIndex
  correctAnswer?: ChoiceIndex
  submitted: boolean
  disabled?: boolean
  onSelect: (choice: ChoiceIndex) => void
}

export function ChoiceGroup({
  questionId,
  choices,
  selected,
  correctAnswer,
  submitted,
  disabled,
  onSelect,
}: ChoiceGroupProps) {
  return (
    <ol className="m-0 flex list-none flex-col gap-px p-0" aria-label={`${questionId}번 선택지`}>
      {choices.map((text, i) => {
        const value = (i + 1) as ChoiceIndex
        const isSelected = selected === value
        const isCorrect = submitted && correctAnswer === value
        const isWrong = submitted && isSelected && correctAnswer !== value

        return (
          <li key={value}>
            <button
              type="button"
              className="group grid w-full grid-cols-[1.35em_1fr] gap-0.5 rounded-none border border-transparent bg-transparent px-0.5 py-px text-left text-[11.5px] leading-[1.45] text-inherit"
              disabled={disabled || submitted}
              aria-pressed={isSelected}
              onClick={() => onSelect(value)}
            >
              <span
                className="relative inline-flex w-[1.2em] items-center justify-center font-semibold leading-none group-hover:opacity-70"
                aria-hidden
              >
                {CHOICE_MARKS[i]}
                {isSelected ? (
                  <span
                    className="pointer-events-none absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-[54%] -rotate-12 text-[2.1em] font-bold leading-none text-check [text-shadow:0_0_1px_#fff]"
                    aria-hidden
                  >
                    ✓
                  </span>
                ) : null}
              </span>
              <span
                className={`break-keep ${
                  isCorrect ? 'text-correct' : isWrong ? 'text-wrong' : ''
                }`}
              >
                {text}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
