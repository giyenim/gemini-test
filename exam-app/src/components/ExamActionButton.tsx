import type { ReactNode } from 'react'

/** 제출 / 답지 보기 등 시험지 액션 버튼 */
export function ExamActionButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="border border-line bg-white px-5 py-2 font-serif text-[14px] font-semibold text-ink enabled:hover:bg-hover disabled:opacity-50"
      onClick={onClick}
    >
      {children}
    </button>
  )
}
