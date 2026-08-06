/**
 * 그림 블록 — 화면 캡처·도해
 *
 * 높이를 항상 고정한다. 이미지 로드 시점에 따라 문제 높이가 달라지면
 * 측정(Measure) → 패킹(Pack) 결과가 흔들리기 때문이다.
 * `srcs`가 비어 있으면 그림이 들어올 자리만 점선으로 잡아 둔다.
 *
 * 여러 장을 **가로로** 나열하면 각 그림이 단 폭의 절반까지밖에 못 커진다.
 * 크게 보여야 하면 `stack`으로 세로로 쌓는다 (높이가 곧 그림 크기가 된다).
 */
interface FigureBlockProps {
  srcs?: string[]
  labels?: string[]
  height: number
  stack?: boolean
  note?: string
}

export function FigureBlock({ srcs, labels, height, stack, note }: FigureBlockProps) {
  const list = (srcs ?? []).filter(Boolean)
  const hasLabels = (labels ?? []).some(Boolean)

  if (list.length === 0) {
    return (
      <div
        className="flex items-center justify-center border border-dashed border-line px-2 text-center text-[10.5px] leading-[1.4] text-ink/50"
        style={{ height }}
      >
        {note ?? '그림 자리'}
      </div>
    )
  }

  return (
    <div
      className={
        stack
          ? 'flex flex-col items-stretch justify-center gap-2'
          : 'flex items-stretch justify-center gap-2'
      }
      style={{ height }}
    >
      {list.map((src, i) => (
        <figure key={src} className="m-0 flex min-w-0 min-h-0 flex-1 flex-col items-center">
          <img
            src={`${import.meta.env.BASE_URL}figures/${src}`}
            alt=""
            className="min-h-0 w-full flex-1 object-contain"
          />
          {hasLabels ? (
            <figcaption className="mt-0.5 shrink-0 text-[10.5px] leading-none">
              {labels?.[i] ?? ''}
            </figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  )
}
