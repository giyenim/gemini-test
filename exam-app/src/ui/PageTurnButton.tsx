import type { ReactNode } from 'react'

export function PageTurnButton({
  children,
  disabled,
  onClick,
  dotClass = 'fill-rose-500',
}: {
  children: ReactNode
  disabled?: boolean
  onClick?: () => void
  /** 호버 점 색. 비활성일 때는 무시된다 (`group-disabled:` 가 이긴다) */
  dotClass?: string
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      /*
        끝에 닿아도 흐리게 만들지 않는다 — 문구가 이유를 말하므로(`첫 페이지입니다`)
        흐림을 덧붙이면 정작 읽어야 할 안내가 가려진다. index.css 의 전역
        `button:disabled { opacity: .4 }` 를 여기서만 되돌린다.
      */
      /*
        폭을 고정한다 — 글자 수에 맡기면 문구가 바뀔 때마다 상자가 커졌다 작아진다.
        152 = 가장 긴 문구(`이름을 써 주세요`, text-sm 로 92px) + 좌우 여백 48px + 여유.
        오른쪽 여백이 더 넓은 것은 빗금 자리를 비워 두기 위해서다 — 빗금은 폭의
        79% 지점부터라, 글자가 거기 닿지 않게 `pr` 을 남긴다.
      */
      className="group relative flex aspect-120/50 w-38 items-center justify-center pl-4 pr-8 font-ui text-sm text-ink disabled:cursor-default disabled:opacity-100"
    >
      {/*
        `aspect-120/50` 는 viewBox 비율과 같아야 한다 — 어긋나면 그림이 한쪽으로만
        늘어나 동그라미가 타원이 되고 모서리가 뭉개진다. 높이는 이 비율이 정하므로
        `py-*` 는 쓰지 않는다. 크기는 `px-*` 와 글자 크기로 조절한다.
      */}
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
          {/*
            `fill-white` 는 이 선 하나에만 준다. `<g>` 에 주면 빗금까지 채워져
            열린 선 세 개가 각각 삼각형으로 메워진다.
          */}
          <path
            className="fill-white"
            d="M18 4.5C45 3 82 3.9 104 5.2C114 6.7 117 15.7 116 25.4C115 34.4 118 43 103 45.3C78 47.5 40 46.8 16 45.3C6 43.8 3 34.4 4 24.7C5 15 7 5.8 18 4.5Z"
          />

          {/*
            왼쪽 가운데 점 — cx 13 cy 25 반지름 3.4. 선이 아니라 채운 것.
            평소엔 숨어 있다가 버튼에 손이 닿으면 켜진다. `hover:` 가 아니라
            `group-hover:` 인 것은, 점 자체가 아니라 **버튼 전체**가 기준이기 때문이다.
          */}
          <path
            className={`${dotClass} opacity-0 group-hover:opacity-100 group-disabled:fill-indigo-600`}
            stroke="none"
            d="M13 21.6C14.9 21.7 16.5 23.2 16.4 25.1C16.3 27 14.7 28.5 12.8 28.4C10.9 28.3 9.5 26.6 9.6 24.7C9.7 22.9 11.1 21.5 13 21.6Z"
          />

          {/*
            빗금 — 자리는 translate, 기울기는 rotate, 줄 사이는 각 줄의 translate x.
            셋 다 세로로 그어 두고 기울기를 바깥에서 한 번에 준다.
          */}
          <g strokeWidth="2" transform="translate(103 15) rotate(53)">
            <path transform="translate(-4.5 0)" d="M0 5.9 Q-1.1 0 0.3 -5.4" />
            <path d="M0 6 Q-0.9 0.3 0.2 -6.8" />
            <path transform="translate(4.5 0)" d="M0 5.5 Q-1.2 -0.2 0.1 -5.2" />
          </g>
        </g>
      </svg>
      <span className="relative whitespace-nowrap">{children}</span>
    </button>
  )
}
