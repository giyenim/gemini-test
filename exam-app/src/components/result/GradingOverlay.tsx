import { useEffect, useId, useState } from 'react'
import { ProgressBar, PROGRESS_BAR_W } from '../../ui'
import { GRADING_MESSAGES, GRADING_MS } from './constants'

/**
 * 움직임을 줄이는 설정을 켜 두었는가. 켜져 있으면 글자를 떨지 않게 한다.
 * 화면 크기와 달리 응시 중에 바뀔 일은 거의 없지만, 듣고 있어야 껐을 때 바로 따라간다.
 */
/**
 * 문구 한 줄이 차지하는 높이(px). 16px 글자의 줄상자다.
 * 띠 안쪽(36px)보다 작아야 하고, 미끄러지는 거리이기도 하다 — 줄 높이와 미는 거리가
 * 어긋나면 두 문구가 겹쳐 보인다.
 */
const MESSAGE_H = 24

function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduce(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return reduce
}

/**
 * 채점 중 화면의 **생김새만**. 얼마나 찼는지는 `progress` 로 받는다.
 *
 * 제출 버튼을 `SubmitButtonFace` 와 가른 것과 같은 이유다 — 시간을 재는 일과 그리는
 * 일을 한 몸에 두면 중간 모양을 붙잡고 고칠 수가 없다.
 *
 * 종이를 깔지 않는다 — 채점은 시험지 위에서 일어나는 일이 아니라서, 앞뒤 화면과
 * 같은 책상(모눈·표지 벽지)을 그대로 둔다.
 */
function GradingScreen({ progress }: { progress: number }) {
  const wobbleId = useId()
  const reduceMotion = useReduceMotion()

  /*
   * 지금 보여 줄 문구의 차례. 문구마다 머무는 시간이 같으므로 진행률을 문구 수로 나눈
   * 것이 그대로 차례다 — 어느 시점을 집어도 그 자리의 문구가 나온다.
   * 마지막 칸(진행률 1)에서 범위를 넘지 않게 잘라 준다.
   */
  const step = Math.min(
    GRADING_MESSAGES.length - 1,
    Math.floor(progress * GRADING_MESSAGES.length),
  )

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 font-serif text-ink">
      {/*
        글자가 천천히 일렁이는 필터. 잡음(`feTurbulence`)을 만들고 그 밝기만큼 픽셀을
        밀어낸다(`feDisplacementMap`). 값을 멈춰 두면 그냥 한 번 뭉개진 글자일 뿐이라,
        **잡음을 계속 움직이는 것이 핵심이다.**

        움직이는 값은 `seed` 다. 잡음이 다른 장으로 갈아 끼워지면서 획이 살아 움직인다.
        `seed` 는 정수로 끊어 쓰이므로 잡음이 장 단위로 갈린다 — `dur` 을 짧게 잡으면
        움직임이 아니라 깜빡임으로 보이므로, 장마다 200ms 는 머물게 둔다.

        **결의 굵기가 이 효과의 성패를 가른다.** `baseFrequency` 가 높으면(0.1 언저리)
        잡음 결이 획보다 잘아서, 획이 휘는 대신 가장자리가 점으로 부서진다. 여기 값(0.015)은
        결이 글자보다 굵어 **획 전체가 통째로 휜다.**

        `scale` 은 **절대 px** 이다. 글자를 줄이면 획도 얇아져 같은 밀림이 모양을 휘게 하는
        대신 가장자리만 흐리게 만든다 — 글자 크기를 바꾸면 이 값도 같이 봐야 한다.

        필터 자리(`x`/`y`/…)는 `scale` 보다 넉넉해야 한다 — 밀려난 획이 자리 밖으로
        나가면 그대로 잘린다. 기본값(±10%)으로는 모서리가 깎인다.

        SVG 는 자리를 차지하지 않게 0×0 으로 눕혀 둔다. `display:none` 으로 감추면
        브라우저에 따라 필터까지 같이 사라진다.
      */}
      <svg aria-hidden className="absolute h-0 w-0">
        <defs>
          <filter id={wobbleId} x="-35%" y="-60%" width="170%" height="220%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015"
              numOctaves="1"
              seed="1"
              result="noise"
            >
              {/*
                움직임을 줄여 달라고 한 사용자에게는 일렁이지 않는다 — 계속 흔들리는 글자는
                그 설정이 막으려는 바로 그것이다. `<animate>` 는 CSS 로 못 끄므로
                요소 자체를 안 그린다. 잡음은 그대로 남아 생김새는 유지된다.
              */}
              {reduceMotion ? null : (
                <animate
                  attributeName="seed"
                  values="1;2;3;4;5;6"
                  dur="1.4s"
                  repeatCount="indefinite"
                />
              )}
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" />
          </filter>
        </defs>
      </svg>

      {/* 시험지 밖의 글자라 화면 글꼴(Pretendard)이다 — 명조는 종이 위에서만 쓴다 */}
      <p
        className="m-0 font-ui text-[32px] font-bold tracking-[0.02em]"
        style={{ filter: `url(#${wobbleId})` }}
        role="status"
      >
        채점 중...
      </p>

      {/*
        폭은 띠의 좌표계와 같은 값(`PROGRESS_BAR_W`)이어야 1:1 로 그려진다.
        여기서 숫자를 따로 적으면 캡이 늘어나거나 눌린다.
        좁은 화면에서는 `max-w-full` 이 화면 폭까지 줄인다.
      */}
      <div className="mt-6 max-w-full" style={{ width: PROGRESS_BAR_W }}>
        <ProgressBar value={progress} label="채점 진행률">
          {/*
            문구는 **한 줄만 보이는 창** 안에서 띠 전체가 위로 미끄러진다. 보이는 것만
            갈아 끼우면 앞 문구가 나가는 모습이 없어 툭 바뀌어 보인다 — 줄을 전부 이어
            붙여 두고 통째로 밀어 올려야 한 문구가 나가고 다음 문구가 들어온다.

            미는 거리는 `문구 차례 × 줄 높이` 다. 문구마다 머무는 시간이 같으므로
            차례는 진행률에서 그대로 나온다 — 시계를 따로 두지 않는다.
          */}
          <span className="block w-full overflow-hidden" style={{ height: MESSAGE_H }}>
            <span
              className="block"
              style={{
                transform: `translateY(-${step * MESSAGE_H}px)`,
                transition: reduceMotion ? 'none' : 'transform 420ms ease-out',
              }}
            >
              {/* 강조는 문구마다 `strong`·`accent` 로 정해져 온다 (`constants.ts`) */}
              {GRADING_MESSAGES.map(({ text, strong, accent }) => (
                <span
                  key={text}
                  className={`flex items-center justify-center whitespace-nowrap ${
                    strong ? 'font-medium' : ''
                  } ${accent ? 'text-progress-accent' : ''}`}
                  style={{ height: MESSAGE_H }}
                >
                  {text}
                </span>
              ))}
            </span>
          </span>
        </ProgressBar>
      </div>
    </div>
  )
}

/**
 * 제출 → 성적표 사이에 끼우는 대기 화면 (RESULT-PAGE.md §1).
 *
 * 즉시 띄우지 않고 몇 초를 끄는 것만으로 체감이 크게 올라간다. 화면을 넘기는 타이머는
 * App 이 잡고, 여기서는 같은 시간(`GRADING_MS`)을 다시 재어 띠를 채운다.
 */
export function GradingOverlay() {
  const [progress, setProgress] = useState(0)

  /*
   * 프레임마다 흐른 시간을 재서 채운다. `setInterval` 로 몇 칸씩 끊어 올리면 띠가
   * 계단으로 움직이고, 탭이 잠들었다 깨면 남은 칸이 한꺼번에 밀린다.
   * 시계는 `performance.now()` 로 본다 — 화면이 몇 프레임 건너뛰어도 실제 흐른
   * 시간을 따라가므로, App 이 화면을 넘기는 순간과 띠가 차는 순간이 어긋나지 않는다.
   */
  useEffect(() => {
    const start = performance.now()
    let frame = 0

    const tick = () => {
      const elapsed = performance.now() - start
      setProgress(Math.min(1, elapsed / GRADING_MS))

      // 다 차면 멈춘다 — 화면은 App 이 넘긴다
      if (elapsed < GRADING_MS) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  return <GradingScreen progress={progress} />
}
