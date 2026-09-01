import type { ReactNode } from 'react'

/*
 * 폭 고정 168px — 글자 수에 맡기면 문구가 바뀔 때마다 상자가 커졌다 작아진다.
 * 좌우 여백은 빗금 자리(폭의 79%~)에 맞춘 오른쪽 값으로 통일한다 — 한쪽만 넓히면
 * 글자가 상자 가운데에서 왼쪽으로 밀린다.
 * `aspect-120/50` 는 viewBox 비율과 같아야 한다 — 어긋나면 그림이 한쪽으로만
 * 늘어나 동그라미가 타원이 된다. 높이는 이 비율이 정하므로 `py-*` 는 쓰지 않는다.
 */
const FRAME =
  'group relative flex aspect-120/50 w-42 items-center justify-center px-8 font-ui text-sm text-ink'

function ButtonArt({ dotClass }: { dotClass: string }) {
  return (
    <svg
      aria-hidden
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 120 50"
      preserveAspectRatio="none"
      fill="none"
    >
      <g
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      >
        {/* `fill-white` 는 이 선에만 — `<g>` 에 주면 열린 빗금까지 삼각형으로 메워진다 */}
        <path
          className="fill-white"
          d="M18 4.5C45 3 82 3.9 104 5.2C114 6.7 117 15.7 116 25.4C115 34.4 118 43 103 45.3C78 47.5 40 46.8 16 45.3C6 43.8 3 34.4 4 24.7C5 15 7 5.8 18 4.5Z"
        />

        {/*
          왼쪽 가운데 점 (cx 13 cy 25 r 3.4) — 버튼 전체에 손이 닿으면 켜지므로
          `hover:` 가 아니라 `group-hover:` 다.
        */}
        <path
          className={`${dotClass} opacity-0 group-hover:opacity-100 group-disabled:fill-indigo-600`}
          stroke="none"
          d="M13 21.6C14.9 21.7 16.5 23.2 16.4 25.1C16.3 27 14.7 28.5 12.8 28.4C10.9 28.3 9.5 26.6 9.6 24.7C9.7 22.9 11.1 21.5 13 21.6Z"
        />

        {/* 빗금 — 자리는 바깥 translate, 기울기는 rotate, 줄 사이는 각 줄의 translate x */}
        <g strokeWidth="2" transform="translate(103 15) rotate(53)">
          <path transform="translate(-4.5 0)" d="M0 5.9 Q-1.1 0 0.3 -5.4" />
          <path d="M0 6 Q-0.9 0.3 0.2 -6.8" />
          <path transform="translate(4.5 0)" d="M0 5.5 Q-1.2 -0.2 0.1 -5.2" />
        </g>
      </g>
    </svg>
  )
}

export function PageTurnButton({
  children,
  disabled,
  onClick,
  href,
  dotClass = 'fill-rose-500',
}: {
  children: ReactNode
  disabled?: boolean
  onClick?: () => void
  /** 주면 버튼 대신 새 탭 링크로 렌더된다 — 생김새는 같다 (예: 성적표의 책 링크) */
  href?: string
  /** 호버 점 색. 비활성일 때는 무시된다 (`group-disabled:` 가 이긴다) */
  dotClass?: string
}) {
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={`${FRAME} no-underline`}
      >
        <ButtonArt dotClass={dotClass} />
        <span className="relative whitespace-nowrap">{children}</span>
      </a>
    )
  }

  return (
    <button type="button" disabled={disabled} onClick={onClick} className={FRAME}>
      <ButtonArt dotClass={dotClass} />
      <span className="relative whitespace-nowrap">{children}</span>
    </button>
  )
}
