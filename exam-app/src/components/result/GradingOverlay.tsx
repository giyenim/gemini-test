import { useEffect, useId, useState } from 'react'
import { ProgressBar, PROGRESS_BAR_W } from '../../ui'
import { GRADING_MS } from './constants'

/**
 * 채점 중 화면의 **생김새만**. 얼마나 찼는지는 `progress` 로 받는다.
 *
 * 제출 버튼을 `SubmitButtonFace` 와 가른 것과 같은 이유다 — 저 혼자 시간을 재면
 * 3초 만에 달아나 버려서 중간 모양을 붙잡고 고칠 수가 없다. `?bar` 가 이것을
 * 멈춰 세워 그린다 (`main.tsx`).
 *
 * 종이를 깔지 않는다 — 채점은 시험지 위에서 일어나는 일이 아니라서, 앞뒤 화면과
 * 같은 책상(모눈·표지 벽지)을 그대로 둔다.
 */
export function GradingScreen({ progress }: { progress: number }) {
  const wobbleId = useId()

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 font-serif text-ink">
      {/*
        글자를 물결에 담근 것처럼 흐물흐물하게 만드는 필터. 잡음(`feTurbulence`)을 만들고
        그 값만큼 픽셀을 밀어낸다(`feDisplacementMap`).

        **잦기는 낮게, 폭은 크게** 잡는 것이 요령이다. `baseFrequency` 를 올리면 획이
        잘게 떨려 물결이 아니라 지직거리는 노이즈가 되고, `numOctaves` 를 2 이상 주면
        거친 결이 겹쳐 같은 일이 벌어진다. 여기서는 **1 옥타브**로 매끈한 물결만 남기고
        `scale` 로 크게 휘게 했다.
        필터 자리(`x`/`y`/`width`/`height`)는 `scale` 을 키운 만큼 함께 넓혀야 한다 —
        밀려난 획이 자리 밖으로 나가면 그대로 잘린다. 기본값(±10%)으로는 모서리가 깎인다.

        SVG 는 자리를 차지하지 않게 0×0 으로 눕혀 둔다. `display:none` 으로 감추면
        브라우저에 따라 필터까지 같이 사라진다.
      */}
      <svg aria-hidden className="absolute h-0 w-0">
        <defs>
          <filter id={wobbleId} x="-25%" y="-45%" width="150%" height="190%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.018"
              numOctaves="1"
              seed="11"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="8"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* 시험지 밖의 글자라 화면 글꼴(Pretendard)이다 — 명조는 종이 위에서만 쓴다 */}
      <p
        className="m-0 font-ui text-[32px] font-bold tracking-[0.02em]"
        style={{ filter: `url(#${wobbleId})` }}
        role="status"
      >
        채점 중
      </p>

      {/*
        폭은 띠의 좌표계와 같은 값(`PROGRESS_BAR_W`)이어야 1:1 로 그려진다.
        여기서 숫자를 따로 적으면 캡이 늘어나거나 눌린다.
        좁은 화면에서는 `max-w-full` 이 화면 폭까지 줄인다.
      */}
      <div className="mt-6 max-w-full" style={{ width: PROGRESS_BAR_W }}>
        <ProgressBar value={progress} label="채점 진행률" />
      </div>
    </div>
  )
}

/**
 * 제출 → 성적표 사이에 끼우는 대기 화면 (RESULT-PAGE.md §1).
 *
 * 즉시 띄우지 않고 3초를 끄는 것만으로 체감이 크게 올라간다. 화면을 넘기는 타이머는
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
      const ratio = (performance.now() - start) / GRADING_MS
      setProgress(Math.min(1, ratio))
      if (ratio < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  return <GradingScreen progress={progress} />
}
