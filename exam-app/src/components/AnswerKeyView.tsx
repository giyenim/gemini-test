import { Fragment } from 'react'
import { choiceMark } from './question/ChoiceGroup'
import type { ExamData } from '../types/exam'

interface AnswerKeyViewProps {
  exam: ExamData
  onBack: () => void
}

/** 열당 최대 문항 수 — 레퍼런스 정답표(공통 17칸)에 가깝게 */
const ROWS_PER_COLUMN = 17

/**
 * 수능 정답표 스타일 (레퍼런스: 국어영역_정답표.pdf)
 * 문항 번호 · 정답 · 배점 표. 선택과목 구분이 없으면 공통 열만 구성.
 */
export function AnswerKeyView({ exam, onBack }: AnswerKeyViewProps) {
  const questions = exam.questions
  const columns: (typeof questions)[] = []

  for (let i = 0; i < questions.length; i += ROWS_PER_COLUMN) {
    columns.push(questions.slice(i, i + ROWS_PER_COLUMN))
  }

  if (columns.length === 0) {
    columns.push([])
  }

  const rowCount = Math.max(...columns.map((col) => col.length), 0)

  return (
    <div className="h-full overflow-y-auto overscroll-y-contain bg-[#2a2a2a] text-ink">
      <div className="mx-auto min-h-full w-full max-w-[720px] bg-white px-5 py-8 font-serif">
        <header className="mb-6 text-center">
          <p className="m-0 text-[15px] font-semibold leading-snug tracking-[-0.02em]">
            {exam.meta.year} {exam.meta.title}
          </p>
          <p className="m-0 mt-1 text-[18px] font-bold leading-snug">
            {exam.meta.subject} 정답표
          </p>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-line text-center text-[13px] leading-none">
            <thead>
              <tr>
                <th
                  colSpan={columns.length * 3}
                  className="border border-line bg-white px-2 py-2.5 text-[14px] font-bold"
                >
                  정답
                </th>
              </tr>
              <tr>
                {columns.map((_, colIndex) => (
                  <Fragment key={`sub-${colIndex}`}>
                    <th className="border border-line px-1 py-1.5 text-[11px] font-semibold">
                      문항 번호
                    </th>
                    <th className="border border-line px-1 py-1.5 text-[11px] font-semibold">
                      정답
                    </th>
                    <th className="border border-line px-1 py-1.5 text-[11px] font-semibold">
                      배점
                    </th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rowCount }, (_, row) => (
                <tr key={row}>
                  {columns.map((col, colIndex) => {
                    const question = col[row]
                    if (!question) {
                      return (
                        <Fragment key={`empty-${colIndex}-${row}`}>
                          <td className="border border-line px-2 py-1.5">&nbsp;</td>
                          <td className="border border-line px-2 py-1.5" />
                          <td className="border border-line px-2 py-1.5" />
                        </Fragment>
                      )
                    }
                    return (
                      <Fragment key={`${colIndex}-${question.id}`}>
                        <td className="border border-line px-2 py-1.5 font-semibold">
                          {question.id}
                        </td>
                        <td className="border border-line px-2 py-1.5 font-semibold">
                          {choiceMark(question.answer)}
                        </td>
                        <td className="border border-line px-2 py-1.5">{question.points}</td>
                      </Fragment>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            className="border border-line bg-white px-5 py-2 font-serif text-[14px] font-semibold text-ink hover:bg-[#f5f5f5]"
            onClick={onBack}
          >
            시험지 보기
          </button>
        </div>
      </div>
    </div>
  )
}
