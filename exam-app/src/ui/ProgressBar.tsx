import { useId, type ReactNode } from 'react'

/**
 * 손그림 띠 — 480×46 좌표계로 그렸다. **안에 16px 글월이 앉는 크기**다.
 * 속(획 안쪽)이 36px 이라 16px 글자의 줄상자(24px) 위아래로 6px 씩 남는다.
 *
 * `preserveAspectRatio="none"` 이라 담기는 자리 크기에 맞춰 늘었다 줄었다 하는데,
 * 좌표계(480×46)와 담는 자리를 같은 값으로 두면 1:1 이라 둥근 끝이 늘어나지 않는다.
 * **크기를 바꿀 때는 이 좌표계와 path 를 같이 고친다** — 담는 자리만 넓히면
 * 캡이 옆으로 눌린 타원이 된다. 높이는 px 로 못 박아, 좁은 화면에서 폭이 줄어도
 * 속 높이가 따라 줄지 않는다 (줄면 안에 든 글자가 눌린다).
 *
 * 선 굵기 2 와 `vector-effect` 는 쪽 넘김·제출 버튼과 같은 값이다. 손그림끼리 획이
 * 따로 놀면 한 벌로 보이지 않는다.
 */
const TRACK_PATH =
  'M24 5.4C140 4 330 4.5 456 5.8C468 8 475.2 14.4 474.4 23.4C473.6 32.6 467 38.8 456 41C330 42.4 138 42 24 40.6C12 38.4 4.8 32 5.6 22.8C6.4 13.6 13 7.6 24 5.4Z'
const TRACK_VIEWBOX = '0 0 480 46'
const TRACK_W = 480
const TRACK_H = 46

/** 담기는 자리의 기본 폭 — 좌표계와 같은 값이라야 1:1 이다 */
export const PROGRESS_BAR_W = TRACK_W

/**
 * 채워지는 띠 — **생김새만** 맡고 얼마나 찼는지는 `value` 로 받는다.
 * 제출 버튼을 `SubmitButtonFace` 와 가른 것과 같은 이유다. 저 혼자 시간을 재면
 * 작업장(`?ui`)에서 중간 모양을 붙잡아 둘 수가 없다.
 */
export function ProgressBar({
  value,
  label,
  children,
}: {
  /** 0~1. 벗어난 값은 안에서 잘라 낸다 — 부르는 쪽이 시간을 재다 넘길 수 있다 */
  value: number
  /** 읽어 주는 이름. 눈에는 안 보이고 보조 기기에만 간다 */
  label?: string
  /** 띠 **안**에 앉히는 글월. 16px 기준으로 자리를 잡아 두었다 */
  children?: ReactNode
}) {
  const trackId = useId()
  const clipId = useId()
  const filled = Math.min(1, Math.max(0, value))

  return (
    <div
      className="relative w-full text-ink"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(filled * 100)}
    >
      <svg
        aria-hidden
        className="block w-full"
        style={{ height: TRACK_H }}
        viewBox={TRACK_VIEWBOX}
        preserveAspectRatio="none"
        fill="none"
      >
        {/* id 는 `useId` — 한 화면에 띠가 둘이면 고정 id 가 서로를 덮는다 (작업장이 그렇다) */}
        <defs>
          {/* `vector-effect` 는 상속되지 않는다. `use` 가 아니라 여기 걸어야 한다 */}
          <path id={trackId} d={TRACK_PATH} vectorEffect="non-scaling-stroke" />
          {/* 채움을 띠 안쪽으로 깎는 칼 — 손그림 굴곡을 그대로 따라간다 */}
          <clipPath id={clipId}>
            <path d={TRACK_PATH} />
          </clipPath>
        </defs>

        {/* 빈 띠는 종이와 같은 흰색이다 — 시험지 밖 흰 것은 다 이 색이다 */}
        <use href={`#${trackId}`} className="fill-white" />

        {/*
          채운 만큼만 왼쪽에서 잘라 보여 준다. `width` 를 직접 주는 것은, SVG 기하
          속성을 CSS 로 옮기는 방식(`transform: scaleX`)이 브라우저마다 기준점이 달라서다.
          색은 `--color-progress` 다 (index.css). 이 띠만 쓰는 색이라 여기서 바꿔도
          표지의 띠·배너는 그대로 있다.
        */}
        <rect
          clipPath={`url(#${clipId})`}
          x="0"
          y="0"
          width={TRACK_W * filled}
          height={TRACK_H}
          className="fill-progress"
        />

        {/* 윤곽은 맨 위에 — 채움이 선을 넘어 보이면 손으로 그린 티가 사라진다 */}
        <use
          href={`#${trackId}`}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/*
        글월은 띠 위에 겹쳐 가운데 놓는다. 채움(밝은 회색)과 빈 자리(흰색) 어느 쪽에
        걸쳐도 먹색 글자는 읽히므로, 채움이 지나가도 글자를 손볼 일이 없다.
        `pointer-events-none` — 띠는 읽는 것이지 누르는 것이 아니다.

        `translate-y-px` 는 **눈으로 맞추는 보정**이다. 상자는 이미 가운데인데
        (`items-center`), 한글 글자는 줄상자 안에서 위쪽에 앉는다 — 글꼴이 라틴 문자의
        내림획 자리를 아래에 비워 두기 때문이다. 그대로 두면 띠 안쪽 중심(22.5)보다
        글자 잉크 중심이 1px 위(21.5)에 놓여 떠 보인다. 글자 크기를 바꾸면 이 값도
        다시 재야 한다.

        **400px 이하에서는 12px 로 줄인다.** 띠는 화면 폭을 따라 좁아지는데 글자가 16px 로
        남으면 긴 줄이 잘린다 (`whitespace-nowrap` 이라 갈리는 대신 잘려 나간다).

        두 값은 **지금 들어 있는 가장 긴 글월에서 나온다.** 글월을 고치면 다시 재야 한다.
        재는 법은 아래와 같다 — 띠 안쪽은 `min(480, 화면폭 - 48) - 48` 이다.

          16px 로 담기는 최소 화면폭 = 가장 긴 줄의 폭 + 96
          작은 글자 크기 = 16 × 224 ÷ 가장 긴 줄의 폭   (224 = 320px 화면의 안쪽)

        Tailwind 의 `max-[400px]` 이 아니라 미디어 쿼리를 직접 적은 것은, 그쪽이
        `not all and (width>=400px)` 로 풀려 **400px 자신을 빼먹기** 때문이다.
      */}
      {children ? (
        <div className="pointer-events-none absolute inset-0 flex translate-y-px items-center justify-center px-6 font-ui text-base [@media(width<=400px)]:text-[12px]">
          {children}
        </div>
      ) : null}
    </div>
  )
}
