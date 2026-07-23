import type { Answers, ChoiceIndex, ExamData, Passage, Question } from '../types/exam'
import { PassageBlock } from './question/PassageBlock'
import { QuestionBlock } from './question/QuestionBlock'
import { highlightTerms } from './examText'

interface MobileExamViewProps {
  exam: ExamData
  answers: Answers
  submitted: boolean
  onSelect: (questionId: number, choice: ChoiceIndex) => void
}

interface MobileItemPassageGroup {
  type: 'passage-group'
  key: string
  passage: Passage
  questions: Question[]
}

interface MobileItemQuestionOnly {
  type: 'question'
  key: string
  question: Question
}

type MobileItem = MobileItemPassageGroup | MobileItemQuestionOnly

function buildMobileItems(exam: ExamData): MobileItem[] {
  const questionsById = new Map(exam.questions.map((question) => [question.id, question]))
  const usedQuestionIds = new Set<number>()
  const items: MobileItem[] = []

  for (const passage of exam.passages) {
    const questions = passage.questionIds
      .map((questionId) => questionsById.get(questionId))
      .filter((question): question is Question => question != null)

    questions.forEach((question) => usedQuestionIds.add(question.id))

    items.push({
      type: 'passage-group',
      key: `passage:${passage.id}`,
      passage,
      questions,
    })
  }

  for (const question of exam.questions) {
    if (usedQuestionIds.has(question.id)) continue
    items.push({
      type: 'question',
      key: `question:${question.id}`,
      question,
    })
  }

  return items
}

export function MobileExamView({
  exam,
  answers,
  submitted,
  onSelect,
}: MobileExamViewProps) {
  const items = buildMobileItems(exam)

  return (
    <div className="h-full overflow-y-auto overscroll-y-contain bg-[#2a2a2a] text-ink">
      <div className="mx-auto min-h-full w-full max-w-[640px] bg-white px-4 py-6 text-[11.5px] leading-[1.48] break-keep break-words">
        <header className="mb-5 border-b-[1.15px] border-line pb-4">
          <p className="m-0 text-center font-serif text-[15px] font-semibold tracking-[-0.02em]">
            {exam.meta.year} {exam.meta.title}
          </p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="inline-flex h-7 items-center justify-center whitespace-nowrap rounded-full border border-line px-2.5 font-serif text-[13px] font-bold leading-none">
              {exam.meta.period}
            </div>
            <h1 className="m-0 font-serif text-[22px] font-bold leading-none tracking-[0.08em]">
              {exam.meta.subject}
            </h1>
            <div className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded border border-line px-2.5 font-serif text-[14px] font-bold leading-none">
              {exam.meta.type}
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-8 pb-8">
          {items.map((item) =>
            item.type === 'passage-group' ? (
              <section key={item.key}>
                <PassageBlock
                  label={item.passage.label}
                  intro={item.passage.intro}
                  segments={item.passage.body
                    .split('\n\n')
                    .filter(Boolean)
                    .map((text) => ({ text, indent: true }))}
                  renderBody={(para) => <>{highlightTerms(para)}</>}
                />

                <div className="mt-4 flex flex-col gap-6">
                  {item.questions.map((question) => (
                    <QuestionBlock
                      key={question.id}
                      question={question}
                      selected={answers[question.id]}
                      submitted={submitted}
                      onSelect={(choice) => onSelect(question.id, choice)}
                      renderStem={(stem) => <>{highlightTerms(stem)}</>}
                    />
                  ))}
                </div>
              </section>
            ) : (
              <section key={item.key}>
                <QuestionBlock
                  question={item.question}
                  selected={answers[item.question.id]}
                  submitted={submitted}
                  onSelect={(choice) => onSelect(item.question.id, choice)}
                  renderStem={(stem) => <>{highlightTerms(stem)}</>}
                />
              </section>
            ),
          )}
        </div>

        <footer className="border-t-[1.15px] border-line pt-3 text-center text-[10px] text-ink-muted">
          {exam.meta.copyright}
        </footer>
      </div>
    </div>
  )
}
