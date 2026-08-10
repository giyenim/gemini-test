interface PageNavProps {
  /** 0부터. 0 = 표지 */
  index: number
  total: number
  onChange: (next: number) => void
}

/**
 * 쪽 넘김 — **화면 좌우 가장자리**, 세로 가운데에 하나씩.
 *
 * 시험지 아래에 붙여 두었을 때는 쪽을 끝까지 읽어 내려야 손이 닿았다. 지금은 화면에
 * 고정해 두어 어느 쪽을 보고 있든 같은 자리에 있다. 테두리를 없애고 바탕을 흰색으로
 * 둔 것은 그래서다 — 늘 떠 있는 요소라 버튼처럼 각을 세우면 종이보다 먼저 눈에 띈다.
 *
 * **흰 바탕은 버튼이 아니라 글자에만 깐다.** 손이 닿는 영역은 패딩까지 넓게 두되
 * (`px-4 py-3`), 배경까지 그만큼 칠하면 모눈 위에 흰 판이 두 장 떠 있는 꼴이 된다.
 * 그래서 배경은 안쪽 `span` 이 글자만큼만 갖는다.
 *
 * `nav` 는 화면을 덮지만 `pointer-events-none` 이라 시험지 클릭을 가로채지 않는다.
 * 버튼만 `pointer-events-auto` 로 되살린다.
 *
 * 지금 몇 쪽인지는 시험지 푸터의 쪽 번호 칸이 이미 알려 주므로 여기서 또 세지 않는다.
 * 양 끝에서는 숨기지 않고 **문구를 바꿔** 왜 눌리지 않는지 알린다 (`첫 페이지입니다` /
 * `마지막 페이지입니다`). 사라지게 두면 남은 버튼이 자리를 옮긴다.
 *
 * **끝에 닿았을 때 눌리지 않는다는 표시를 따로 하지 않는다.** 흐림도, 금지 커서도,
 * 손가락 커서도 쓰지 않는다 — `첫 페이지입니다` 라는 문구가 이미 그 말을 하고 있고,
 * 표시를 덧붙이면 정작 읽어야 할 안내가 가려진다. 호버 반응은 눌리는 쪽과 **똑같이**
 * 준다 (`group-hover`, `group-enabled:group-hover` 아님).
 *
 * 화살표는 `←` `→` 다. 조선굴림에 `‹` `›` 글리프가 없어 폴백 글꼴의 점처럼 찍힌다.
 * 화살표와 글자는 두 줄로 나눠 가운데로 맞춘다 — 두 줄 모두 배경을 갖도록
 * `box-decoration-clone` 을 준다. 없으면 첫 줄에만 패딩이 붙어 배경이 어긋난다.
 *
 * 줄 높이와 세로 패딩은 **두 줄의 흰 바탕이 맞닿도록** 맞춘 값이다. 줄 간격이 배경보다
 * 벌어지면 두 줄 사이로 모눈이 비쳐 하이라이트가 끊겨 보인다.
 */
export function PageNav({ index, total, onChange }: PageNavProps) {
  const isFirst = index <= 0
  const isLast = index >= total - 1

  // `disabled:*` 셋은 index.css 의 전역 `button { cursor: pointer }` 와
  // `button:disabled { cursor: not-allowed; opacity: .4 }` 를 이 버튼에서만 되돌린다.
  // 그쪽은 @layer base 라 레이어 없는 유틸리티가 이긴다. 다른 버튼은 그대로 둔다.
  const base =
    'group pointer-events-auto px-4 py-3 text-center font-gothic text-[14px] text-ink disabled:cursor-default disabled:opacity-100'
  // leading 을 줄 배경 높이(글자 14px + 세로 패딩 4+4)와 같은 22px 로 맞춰 두 줄을 맞닿게 한다.
  // **글자 크기를 바꾸면 이 값도 같이 옮겨야 한다** — 어긋나면 두 줄 사이로 모눈이 비친다.
  const label =
    'box-decoration-clone bg-white px-1 py-1 leading-[22px] group-hover:bg-[#f5f5f5]'

  return (
    <nav
      aria-label="쪽 넘김"
      className="pointer-events-none fixed inset-0 z-10 flex items-center justify-between px-4"
    >
      <button
        type="button"
        className={base}
        disabled={isFirst}
        onClick={() => onChange(index - 1)}
      >
        <span className={label}>
          {isFirst ? (
            <>
              첫<br />페이지입니다
            </>
          ) : (
            <>
              ←<br />이전 페이지
            </>
          )}
        </span>
      </button>
      <button
        type="button"
        className={base}
        disabled={isLast}
        onClick={() => onChange(index + 1)}
      >
        <span className={label}>
          {isLast ? (
            <>
              마지막<br />페이지입니다
            </>
          ) : (
            <>
              →<br />다음 페이지
            </>
          )}
        </span>
      </button>
    </nav>
  )
}
