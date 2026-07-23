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
    <ol className="choice-list" aria-label={`${questionId}번 선택지`}>
      {choices.map((text, i) => {
        const value = (i + 1) as ChoiceIndex
        const isSelected = selected === value
        const isCorrect = submitted && correctAnswer === value
        const isWrong = submitted && isSelected && correctAnswer !== value

        let className = 'choice-item'
        if (isSelected) className += ' is-selected'
        if (isCorrect) className += ' is-correct'
        if (isWrong) className += ' is-wrong'

        return (
          <li key={value}>
            <button
              type="button"
              className={className}
              disabled={disabled || submitted}
              aria-pressed={isSelected}
              onClick={() => onSelect(value)}
            >
              <span className="choice-mark" aria-hidden>
                {CHOICE_MARKS[i]}
                {isSelected ? (
                  <span className="choice-check" aria-hidden>
                    ✓
                  </span>
                ) : null}
              </span>
              <span className="choice-text">{text}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
