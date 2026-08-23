import type { ChoiceIndex } from '../../types/exam'
import { CHOICE_MARKS, isCompactChoiceSet } from './choiceMarks'

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
  const compact = isCompactChoiceSet(choices)

  return (
    <ol
      className={
        compact
          ? 'm-0 grid list-none grid-cols-5 p-0'
          : 'm-0 flex list-none flex-col gap-px p-0'
      }
      aria-label={`${questionId}번 선택지`}
    >
      {choices.map((text, i) => {
        const value = (i + 1) as ChoiceIndex
        const isSelected = selected === value
        const showCircle = submitted && correctAnswer === value
        const showCross = submitted && isSelected && correctAnswer !== value

        return (
          <li key={value}>
            <button
              type="button"
              className={
                compact
                  ? 'group grid w-full grid-cols-[1.15em_1fr] gap-[0.2em] rounded-none border border-transparent bg-transparent py-px text-left text-[11.5px] leading-[1.5] whitespace-nowrap text-inherit'
                  : 'group grid w-full grid-cols-[1.35em_1fr] gap-0.5 rounded-none border border-transparent bg-transparent px-0.5 py-px text-left text-[11.5px] leading-[1.5] text-inherit'
              }
              disabled={disabled || submitted}
              aria-pressed={isSelected}
              onClick={() => onSelect(value)}
            >
              <span
                className="relative inline-flex w-[1.2em] items-center justify-center font-normal leading-none group-hover:opacity-70"
                aria-hidden
              >
                {CHOICE_MARKS[i]}
                {!submitted && isSelected ? (
                  <span
                    className="pointer-events-none absolute select-none top-[48%] left-1/2 -translate-x-1/2 -translate-y-[54%] -rotate-12 text-[2.1em] font-bold leading-none text-check [text-shadow:0_0_1px_#fff]"
                  >
                    ✓
                  </span>
                ) : null}
                {showCircle ? (
                  <span className="pointer-events-none absolute select-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[1.85em] font-bold leading-none text-check [text-shadow:0_0_1px_#fff]">
                    ○
                  </span>
                ) : null}
                {showCross ? (
                  <span className="pointer-events-none absolute select-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[1.55em] font-bold leading-none text-check [text-shadow:0_0_1px_#fff]">
                    ✕
                  </span>
                ) : null}
              </span>
              <span>{text}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
