import { useState, type FormEvent } from 'react'
import type { ExamMeta } from '../types/exam'

interface NameEntryViewProps {
  meta: ExamMeta
  questionCount: number
  totalPoints: number
  onStart: (name: string) => void
}

const MAX_NAME = 12

/**
 * 응시 전 이름 입력 (RESULT-PAGE.md §0).
 *
 * **이름 한 칸만** 받는다. 수험 번호는 응시 시각으로 자동 발급한다.
 * 여기서 받은 이름이 시험지 성명란과 성적표에 같은 글꼴로 들어가, 둘이 한 세트로 보이게 한다.
 */
export function NameEntryView({
  meta,
  questionCount,
  totalPoints,
  onStart,
}: NameEntryViewProps) {
  const [name, setName] = useState('')
  const trimmed = name.trim()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (trimmed) onStart(trimmed)
  }

  return (
    <div className="h-full overflow-y-auto bg-white text-ink">
      <div className="mx-auto flex min-h-full w-full max-w-[420px] flex-col justify-center px-6 py-10 font-serif">
        <header className="text-center">
          <p className="m-0 text-[13px] tracking-[-0.01em]">{meta.year}</p>
          <h1 className="m-0 mt-1.5 text-[22px] font-bold leading-snug">{meta.title}</h1>
          <p className="m-0 mt-3 text-[12.5px] text-ink-muted">
            {meta.subject.replace(/\s+/g, ' ')} · {questionCount}문항 · {totalPoints}점
          </p>
        </header>

        <form onSubmit={submit} className="mt-9">
          <label
            htmlFor="examinee-name"
            className="block text-center text-[12.5px] text-ink-muted"
          >
            성명을 적고 시작하세요
          </label>

          {/* 인쇄된 양식의 기입란 — 밑줄 한 줄만 둔다 */}
          <input
            id="examinee-name"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, MAX_NAME))}
            maxLength={MAX_NAME}
            autoComplete="name"
            autoFocus
            placeholder="이름"
            className="mt-3 w-full border-0 border-b-[1.5px] border-line bg-transparent pb-1.5 text-center font-write text-[24px] leading-none text-ink outline-none placeholder:text-[20px] placeholder:font-serif placeholder:text-ink-muted/40 focus:border-accent"
          />

          <button
            type="submit"
            disabled={!trimmed}
            className="mt-8 w-full border border-line bg-white py-3 font-serif text-[14px] font-semibold text-ink hover:bg-[#f5f5f5]"
          >
            시험 시작
          </button>
        </form>

        <p className="m-0 mt-6 text-center text-[11.5px] leading-[1.7] text-ink-muted">
          수험 번호는 시작할 때 자동으로 발급됩니다.
          <br />
          제출하면 성적통지표를 받습니다.
        </p>
      </div>
    </div>
  )
}
