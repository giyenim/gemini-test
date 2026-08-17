import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

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

/** 점 하나의 손그림 윤곽 — 쪽 넘김 버튼의 그 점을 원점으로 옮겨 온 것. 0~7 단위를 채운다 */
const DOT_PATH =
  'M3.5 0.1C5.4 0.2 7 1.7 6.9 3.6C6.8 5.5 5.2 7 3.3 6.9C1.4 6.8 0 5.1 0.1 3.2C0.2 1.4 1.6 0 3.5 0.1Z'

/**
 * 테두리 — viewBox(400×112)를 버튼의 실제 픽셀 크기와 1:1 로 맞춰 그렸다.
 * 어긋나면 그만큼 그림이 늘어난다. 버튼 크기를 바꾸면 이 path 와 viewBox 를 같이 잡는다.
 */
const OUTLINE_PATH =
  'M36 9C110 6 250 7 364 9.5C382 12 392 26 391 56C390.5 78 394 96 366 101C260 105 120 104 36 101.5C16 98 7 84 8.5 56C9.5 30 14 12 36 9Z'
const OUTLINE_VIEWBOX = '0 0 400 112'

/**
 * 점이 도는 길 — 글자를 감싸는 타원. 눈에 보이지 않고 궤도로만 쓰인다.
 *
 * 시작점 (200 28)은 점들이 **쉬고 있던 그 자리**다. 거기서 출발해 한 바퀴 돌고
 * 같은 자리로 돌아오므로, 멈춘 뒤 모양이 쉬던 때와 정확히 겹친다.
 * 세로 반지름 28 은 그 자리와 한가운데(56)의 거리라서, 궤도가 쉬는 자리를 지난다 —
 * 정지 위치(`top-[25%]`)를 옮기면 이 값도 같이 옮겨야 한다.
 *
 * 가로 반지름 120 으로 납작한 것은 글자가 옆으로 길어서다. 정원으로 돌리면 글자를
 * 비켜 가려고 반지름을 키워야 하는데, 버튼 높이가 112 뿐이라 테두리를 뚫고 나간다.
 * 확인 문구를 더 늘리면 이 값을 키워야 점이 글자를 밟지 않는다.
 *
 * `sweep` 플래그가 0 이라 반시계 방향이다 (1 로 바꾸면 시계 방향).
 */
const ORBIT_PATH = 'M200 28a120 28 0 1 0 0 56a120 28 0 1 0 0 -56Z'

/** 점 하나가 화면에서 차지하는 크기 (px). `DOT_PATH` 의 7 단위를 이만큼으로 키운다 */
const DOT_SIZE = 8.9

/** 이웃한 두 점의 중심 간격 — 크기 + 정지 상태의 `gap-1.5`(6px) */
const DOT_SPACING = DOT_SIZE + 6

/**
 * 도는 점 하나를 궤도 위에 앉히는 변환.
 *
 * `scale` 로 0~7 단위를 `DOT_SIZE` 로 키우고, `translate` 로 그 절반만큼 당겨
 * 중심이 궤도 위에 오게 한다. 여기에 트랙에서의 제 자리(`lead`)를 더한다.
 *
 * `lead` 는 화면 가로가 아니라 **진행 방향** 앞뒤다 — `animateMotion` 의
 * `rotate="auto"` 가 좌표축을 진행 방향으로 돌려 놓기 때문이다. 그래서 양수면
 * 앞서고 음수면 처진다. 곡선 구간에서도 셋이 트랙을 따라 한 줄로 늘어선다.
 * (가로 고정이면 좌우 구간에서 옆으로 늘어서 한 덩어리처럼 보인다.)
 */
function orbitDotTransform(lead: number) {
  const half = DOT_SIZE / 2
  return `translate(${lead - half} ${-half}) scale(${DOT_SIZE / 7})`
}

/** 한 바퀴 도는 데 걸리는 시간 (초). 딱 한 바퀴만 돌고 멈춘다 */
const ORBIT_DURATION = 1.8

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
  /** 확인을 묻는 중 — 테두리를 덧그리고 점을 켜 둔다 */
  asking?: boolean
  onClick?: () => void
  onBlur?: () => void
}) {
  const outlineId = useId()
  const orbitId = useId()
  const svgRef = useRef<SVGSVGElement>(null)

  /*
   * 점을 실제로 출발시킨다.
   *
   * SMIL 의 `begin` 은 요소가 생긴 시각이 아니라 **SVG 문서 타임라인** 기준이다.
   * 그래서 `begin="0s"` 로 두면, 페이지가 열린 지 한참 뒤에 눌러 끼워 넣은 이 요소는
   * 시작 시각이 이미 지나간 과거가 되어 곧장 끝 상태로 건너뛴다 — 돌지 않는다.
   * `begin="indefinite"` 로 재워 두고 여기서 깨우는 이유다.
   *
   * `useEffect` 가 아니라 `useLayoutEffect` 인 것은, 그리기 전에 출발시켜야
   * 변환이 걸리지 않은 첫 프레임(점이 왼쪽 위 구석에 찍힌 모습)이 새지 않아서다.
   */
  useLayoutEffect(() => {
    if (!asking) return
    svgRef.current
      ?.querySelectorAll('animateMotion')
      .forEach((motion) => (motion as SVGAnimationElement).beginElement())
  }, [asking])

  return (
    <button
      type="button"
      onBlur={onBlur}
      onClick={onClick}
      /*
       * 옆으로 긴 상자 — 폭과 높이를 `w-*` `h-*` 로 각각 못 박는다.
       * 쪽 넘김 버튼은 `aspect-*` 로 비율을 묶어 뒀지만 여기서는 일부러 풀었다.
       * 비율을 묶으면 폭을 늘릴 때 높이가 딸려 올라가는데, 제출 버튼은 넓적해야 한다.
       *
       * 크기를 만질 때는 여기 `w-* h-*` 와 `OUTLINE_VIEWBOX`, `OUTLINE_PATH` 셋을
       * 함께 봐야 한다. 지금은 400×112 로 1:1 이라 그림이 늘어나지 않는다.
       * 어긋나면 그만큼 늘어나고 (`preserveAspectRatio="none"`), 도는 점의 궤도도
       * 테두리를 따라 같이 일그러진다.
       *
       * 높이가 `SUBMIT_ACTION_H`(layout/constants.ts) 를 넘으면 PC 마지막 단이 밀린다.
       * 생김새를 먼저 잡고 그 값을 나중에 맞추기로 했다.
       */
      className="group relative flex h-28 w-100 items-center justify-center px-4 font-ui text-base text-ink"
    >
      <svg
        ref={svgRef}
        aria-hidden
        className="absolute inset-0 h-full w-full"
        viewBox={OUTLINE_VIEWBOX}
        preserveAspectRatio="none"
        fill="none"
      >
        {/*
          그리는 선과 도는 길은 서로 다른 도형이다 — 테두리는 눈에 보이고,
          궤도는 글자를 감싸는 타원이라 보이지 않는다.
          id 는 `useId` 로 받는다 — 작업장처럼 버튼이 여러 개면 고정 id 가 부딪친다.
        */}
        <defs>
          {/* `vector-effect` 는 상속되지 않는다 — `use` 쪽에 걸면 여기로 내려오지 않는다 */}
          <path id={outlineId} d={OUTLINE_PATH} vectorEffect="non-scaling-stroke" />
          <path id={orbitId} d={ORBIT_PATH} />
        </defs>

        <use
          href={`#${outlineId}`}
          className="fill-white"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/*
          누르면 점 셋이 글자 둘레를 반시계로 한 바퀴 돈다 — 트랙을 한 줄로 달리는 모양.

          셋 다 같은 궤도를 같은 시각에 돈다. 앞뒤 간격은 `orbitDotTransform` 의
          `lead` 가 만든다 — `DOT_COLORS` 의 첫 색이 가장 앞서고 뒤로 갈수록 처진다.
          출발 시각을 어긋내면 간격은 생기지만 도착도 어긋나 끝에서 한 점에 포개진다.

          `rotate="auto"` 가 좌표축을 진행 방향으로 돌려 준다. 이게 없으면 어긋남이
          화면 가로로 고정돼, 궤도 좌우 구간에서 셋이 옆으로 늘어서 한 덩어리가 된다.

          `fill="freeze"` 로 마지막 자리에 멈춘다. 궤도의 시작과 끝이 쉬던 자리라
          한 바퀴 뒤 모양이 멈춰 있을 때와 겹친다.

          `calcMode="spline"` 은 처음과 끝을 무르게 만든다 — 등속으로 돌리면
          출발과 정지가 툭 끊긴다.
        */}
        {asking
          ? DOT_COLORS.map((fill, i) => (
              <g key={fill}>
                <path
                  className={fill}
                  transform={orbitDotTransform(((DOT_COLORS.length - 1) / 2 - i) * DOT_SPACING)}
                  d={DOT_PATH}
                />
                <animateMotion
                  dur={`${ORBIT_DURATION}s`}
                  /* 문서 시각이 아니라 위 `useLayoutEffect` 의 신호로 출발한다 */
                  begin="indefinite"
                  repeatCount="1"
                  fill="freeze"
                  rotate="auto"
                  calcMode="spline"
                  keyPoints="0;1"
                  keyTimes="0;1"
                  keySplines="0.45 0 0.2 1"
                >
                  <mpath href={`#${orbitId}`} />
                </animateMotion>
              </g>
            ))
          : null}
      </svg>

      {/*
        멈춰 있을 때의 점 세 개 — 가운데 위에 나란히. 손이 닿으면 켜지므로
        `hover:` 가 아니라 `group-hover:` 다. 누르면 이 줄은 사라지고 위 SVG 안의
        도는 점들이 대신 나온다 — 같은 점이 제자리에서 궤도로 옮겨 가는 셈이다.

        이쪽은 테두리 SVG **밖**이라 배율과 무관하게 늘 정확한 원이다.
        8.9px 은 쪽 넘김 버튼의 점과 같은 크기 (그쪽 viewBox 7 단위 × 152/120).
        색과 차례는 `DOT_COLORS`, 사이는 `gap-1.5`(6px).

        `top-*` 이 테두리 윗변과의 간격을 정한다. 퍼센트라 버튼 높이를 바꿔도
        윗변을 따라다니지만, 아주 납작하게 줄이면 선에 닿는다 — 그때는 숫자를 올린다.
      */}
      {asking ? null : (
        <div
          aria-hidden
          className="absolute left-1/2 top-[25%] flex -translate-x-1/2 -translate-y-1/2 gap-1.5 opacity-0 group-hover:opacity-100"
        >
          {DOT_COLORS.map((fill) => (
            <svg key={fill} width="8.9" height="8.9" viewBox="0 0 7 7" fill="none">
              <path className={fill} d={DOT_PATH} />
            </svg>
          ))}
        </div>
      )}
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
