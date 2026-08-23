import { useEffect, useId, useState } from 'react'

/**
 * 확인 문구가 저절로 되돌아가기까지 (ms).
 * 물어본 채로 두고 오면 다음에 와서 무심코 누른 한 번이 제출이 되어 버린다.
 */
const CONFIRM_TIMEOUT = 4000

/**
 * 가운데 위에 나란히 찍는 점 세 개. 왼쪽부터 이 순서로 놓인다.
 * 색은 쪽 넘김 버튼이 이미 쓰던 것을 그대로 가져왔다 — 빨강은 그쪽 기본값,
 * 파랑은 비활성일 때 색, 노랑은 작업장에서 `dotClass` 로 넘기던 색.
 * 손그림 버튼끼리 점 색을 따로 놀게 두지 않는다.
 */
const DOT_COLORS = ['fill-rose-500', 'fill-indigo-600', 'fill-yellow-300']

/**
 * 점 하나가 화면에서 차지하는 크기 (px).
 *
 * 시험지는 `App.tsx` 의 `zoom`(최대 `SHEET_ZOOM` = 1.35) 안에 들어 있고 쪽 넘김 버튼은
 * 그 밖에 고정돼 있다. 그래서 소스에 같은 값을 적으면 이쪽만 1.35 배로 커진다.
 * 6.6 은 그 배율을 미리 되나눈 값이다 — 6.6 × 1.35 ≈ 8.9 로, 화면에서 쪽 넘김 버튼의
 * 점(8.6px)과 같아진다. 창이 좁아 배율이 1.35 아래로 내려가면 그만큼 같이 작아진다.
 */
const DOT_PX = 6.6

/** 점 하나의 손그림 윤곽 — 쪽 넘김 버튼의 그 점을 원점으로 옮겨 온 것. 0~7 단위를 채운다 */
const DOT_PATH =
  'M3.5 0.1C5.4 0.2 7 1.7 6.9 3.6C6.8 5.5 5.2 7 3.3 6.9C1.4 6.8 0 5.1 0.1 3.2C0.2 1.4 1.6 0 3.5 0.1Z'

/**
 * 테두리 — viewBox(318×60)을 **PC 시험지 한 단 폭**과 1:1 로 맞춰 그렸다.
 * 318 은 `columnWidth(PAGE_W)`(layout/constants.ts) 의 값이다 — 단 폭 규칙이 바뀌면
 * 여기 viewBox 와 path 의 가로도 같이 잡아야 그림이 늘어나지 않는다.
 *
 * 모바일은 단이 곧 화면이라 폭이 기기마다 다르다. 거기서는 `preserveAspectRatio="none"`
 * 이 가로로 늘였다 줄였다 하는데, 손그림 윤곽이라 눈에 거슬리지 않는다.
 */
const OUTLINE_PATH =
  'M28.6 4.8C87.5 3.2 198.8 3.8 289.4 5.1C303.7 6.4 311.6 14 310.8 30C310.4 41.8 313.2 51.4 291 54.1C206.7 56.2 95.4 55.7 28.6 54.4C12.7 52.5 5.6 45 6.8 30C7.6 16 11.1 6.4 28.6 4.8Z'
const OUTLINE_VIEWBOX = '0 0 318 60'

/**
 * 생김새만 — 단계를 스스로 정하지 않고 `asking` 으로 받는다.
 *
 * 상태와 가른 것은 작업장(`?ui`) 때문이다. 확인 단계는 4초면 저절로 풀려서,
 * 그 모양을 잡는 동안 자꾸 달아난다. 여기서는 두 단계를 나란히 세워 두고 그릴 수 있다.
 */
export function SubmitButtonFace({
  asking = false,
  onClick,
  onBlur,
}: {
  /** 확인을 묻는 중 — 문구만 바뀐다 */
  asking?: boolean
  onClick?: () => void
  onBlur?: () => void
}) {
  const outlineId = useId()

  return (
    <button
      type="button"
      onBlur={onBlur}
      onClick={onClick}
      /*
       * 폭은 담긴 자리를 그대로 채운다 — PC 는 시험지 한 단(318), 모바일은 페이지 폭.
       * 숫자로 못 박지 않는 것은 단 폭이 `columnWidth()` 에서 나오기 때문이다.
       * 높이만 `h-*` 로 잡는다. 쪽 넘김 버튼처럼 `aspect-*` 로 비율을 묶으면
       * 폭이 넓어질 때 높이가 딸려 올라가는데, 제출 버튼은 넓적해야 한다.
       *
       * `OUTLINE_VIEWBOX` 가 318×60 이라 PC 에서는 1:1 이다. 모바일은 폭이 그때그때
       * 달라 가로로만 늘었다 줄었다 한다 (`preserveAspectRatio="none"`).
       *
       * 높이가 `SUBMIT_ACTION_H`(layout/constants.ts) 를 넘으면 PC 마지막 단이 밀린다.
       * 생김새를 먼저 잡고 그 값을 나중에 맞추기로 했다.
       */
      className="group relative flex h-15 w-full items-center justify-center px-4 font-ui text-sm text-ink"
    >
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full"
        viewBox={OUTLINE_VIEWBOX}
        preserveAspectRatio="none"
        fill="none"
      >
        {/* id 는 `useId` 로 받는다 — 작업장처럼 버튼이 여러 개면 고정 id 가 부딪친다 */}
        <defs>
          {/* `vector-effect` 는 상속되지 않는다 — `use` 쪽에 걸면 여기로 내려오지 않는다 */}
          <path id={outlineId} d={OUTLINE_PATH} vectorEffect="non-scaling-stroke" />
        </defs>

        {/* 선 굵기 2 는 쪽 넘김 버튼과 같은 값이다 — 손그림 버튼끼리 획이 따로 놀면 안 된다 */}
        <use
          href={`#${outlineId}`}
          className="fill-white"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/*
        점 세 개 — 가운데 위에 나란히. 평소에는 손이 닿아야 켜지므로 `hover:` 가 아니라
        `group-hover:` 다. **확인을 묻는 동안에는 손을 떼도 켜 둔다** — 되돌릴 수 없는
        한 번이 남았다는 표시라, 손이 버튼을 벗어났다고 꺼지면 안 된다.

        크기는 `DOT_PX`, 색과 차례는 `DOT_COLORS`, 사이는 `gap-1.5`(6px).

        `top-*` 이 테두리 윗변과의 간격을 정한다. 퍼센트라 버튼 높이를 바꿔도
        윗변을 따라다니지만, 납작해질수록 아래 글자와 가까워진다 — 높이를 60 까지 줄이며
        25% → 21% 로 올려 윗변과 글자 사이를 다시 반씩 나눴다. 점이 `DOT_PX` 로 작아지며
        위아래 4px 씩 남는다.
      */}
      <div
        aria-hidden
        className={`absolute left-1/2 top-[21%] flex -translate-x-1/2 -translate-y-1/2 gap-1.5 ${
          asking ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        {DOT_COLORS.map((fill) => (
          <svg key={fill} width={DOT_PX} height={DOT_PX} viewBox="0 0 7 7" fill="none">
            <path className={fill} d={DOT_PATH} />
          </svg>
        ))}
      </div>
      {/*
        `whitespace-nowrap` 이라 문구가 길어져도 줄이 갈리지 않는다 — 대신 상자보다
        길어지면 밖으로 삐져나온다. 확인 문구를 더 늘릴 때는 폭을 함께 봐야 한다.
      */}
      <span className="relative whitespace-nowrap">
        {asking ? '정말 제출하시겠습니까?' : '제출'}
      </span>
    </button>
  )
}

/**
 * 제출 버튼 — 한 번 눌러 묻고, 다시 눌러야 낸다.
 *
 * 되돌릴 수 없는 단추라 두 단계로 나눴다. 확인 단계는 창을 띄우지 않고 버튼 안에서
 * 끝난다 — 시험지 위에 덮개를 씌우면 마지막 문제를 다시 볼 수가 없다.
 * 물러나는 길은 셋: 시간이 지나거나(`CONFIRM_TIMEOUT`), Esc 를 누르거나, 딴 데를 짚거나.
 *
 * 생김새는 `SubmitButtonFace` 가 맡는다 — 고치려면 그쪽이다.
 */
export function SubmitButton({ onSubmit }: { onSubmit: () => void }) {
  const [asking, setAsking] = useState(false)

  // 물어보는 동안만 시간을 잰다
  useEffect(() => {
    if (!asking) return
    const id = window.setTimeout(() => setAsking(false), CONFIRM_TIMEOUT)
    return () => window.clearTimeout(id)
  }, [asking])

  useEffect(() => {
    if (!asking) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAsking(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [asking])

  return (
    <SubmitButtonFace
      asking={asking}
      // 딴 데를 짚으면 물러난다 — 확인 단계를 켜 둔 채로 남겨 두지 않는다
      onBlur={() => setAsking(false)}
      onClick={() => {
        if (!asking) {
          setAsking(true)
          return
        }
        setAsking(false)
        onSubmit()
      }}
    />
  )
}
