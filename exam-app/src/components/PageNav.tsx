interface PageNavProps {
  /** 0부터. 0 = 표지 */
  index: number
  total: number
  onChange: (next: number) => void
}

/**
 * 쪽 넘김 — **시험지 맨 아래**, 종이 폭에 맞춰 좌우 끝에 하나씩.
 *
 * 화면에 고정하지 않는다. 쪽을 끝까지 읽어 내린 자리에서 자연스럽게 손이 닿아야 하고,
 * 고정해 두면 시험지 위에 계속 떠 있어 종이의 인상을 깬다.
 *
 * 지금 몇 쪽인지는 시험지 푸터의 쪽 번호 칸이 이미 알려 주므로 여기서 또 세지 않는다.
 * 양 끝에서는 숨기지 않고 흐리게 죽인다 — 사라지면 남은 버튼이 자리를 옮긴다.
 *
 * 화살표는 `←` `→` 다. 조선굴림에 `‹` `›` 글리프가 없어 폴백 글꼴의 점처럼 찍힌다.
 */
export function PageNav({ index, total, onChange }: PageNavProps) {
  const base =
    'border border-line bg-white px-5 py-2 font-gothic text-[14px] font-bold text-ink enabled:hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-30'

  return (
    <nav aria-label="쪽 넘김" className="mt-5 flex w-full items-center justify-between">
      <button
        type="button"
        className={base}
        disabled={index <= 0}
        onClick={() => onChange(index - 1)}
      >
        ← 이전 장
      </button>
      <button
        type="button"
        className={base}
        disabled={index >= total - 1}
        onClick={() => onChange(index + 1)}
      >
        다음 장 →
      </button>
    </nav>
  )
}
