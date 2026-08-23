import type { ReactNode } from 'react'
import { CloseIconButton } from './IconButton'

/**
 * 손그림 종이 창 — 서명 창과 같은 윤곽을 쓰되 크기는 내용이 정한다.
 *
 * 서명 창(`SignatureModal`)은 도화지 비율(662×382)을 지켜야 해서 크기를 못 바꾸는데,
 * 이쪽은 표가 길어지면 세로로 늘어나야 한다. 그래서 같은 path 를 `preserveAspectRatio="none"`
 * 으로 늘여 쓴다 — 손그림 윤곽이라 모서리가 조금 눌려도 티가 나지 않는다.
 *
 * 창을 띄우는 일(어둡게 깔기·Esc·바깥 누르기·스크롤 잠금)은 쓰는 쪽이 `Modal` 로 감싼다.
 */
/** 좌우 안쪽 여백 — 제목 줄과 본문이 같은 값을 써야 글자가 한 세로선에 선다 */
const PAD_X = 'px-16'

export function PaperWindow({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="relative flex max-h-full w-full flex-col font-ui text-ink">
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 662 382"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          className="fill-white"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          d="M55 10C200 6 450 7.5 610 11C640 18 654 60 651 190C648 320 655 358 605 368C420 375 200 374 52 368C20 360 8 300 9 185C10 70 22 15 55 10Z"
        />
      </svg>

      {/* 제목 줄 — 구분선을 긋지 않는다. 종이 위에 적어 넣은 것처럼 둔다 */}
      <div className={`relative flex shrink-0 items-center pt-6 ${PAD_X}`}>
        <h2 className="m-0 text-base font-semibold">{title}</h2>
        <div className="ml-auto">
          <CloseIconButton onClick={onClose} />
        </div>
      </div>

      <div className={`relative min-h-0 flex-1 overflow-y-auto overscroll-contain pt-4 pb-9 ${PAD_X}`}>
        {children}
      </div>
    </div>
  )
}
