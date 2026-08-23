import type { ReactNode } from 'react'

/**
 * 아이콘 버튼 — 테두리 없이 글리프만, 손이 닿는 자리는 글리프보다 넓게.
 * `selected` 는 도구 고르는 버튼(펜·지우개)에만 준다 — 고른 것은 잉크, 아닌 것은 회색.
 * `undefined` 면 고르는 버튼이 아니라는 뜻이고 늘 잉크다 (닫기).
 */
export function IconButton({
  label,
  selected,
  disabled,
  onClick,
  children,
}: {
  label: string
  selected?: boolean
  /** 더 갈 곳이 없을 때 — 자리는 지키고 회색으로 죽인다 (사라지면 옆 것이 자리를 옮긴다) */
  disabled?: boolean
  onClick?: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center bg-transparent hover:text-yellow-300 disabled:hover:text-gray-300 ${
        selected === false || disabled ? 'text-gray-300' : 'text-ink'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </button>
  )
}

/** 닫기 ✕ — 손그림 창들이 같은 획을 쓴다 */
export function CloseIconButton({ onClick }: { onClick: () => void }) {
  return (
    <IconButton label="닫기" onClick={onClick}>
      <path d="M6.5 6Q12 11.5 17.8 17.9" />
      <path d="M17.9 6.2Q12.2 12 6.2 17.8" />
    </IconButton>
  )
}
