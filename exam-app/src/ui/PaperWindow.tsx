import { useId, type ReactNode } from 'react'
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
/** 좌우 안쪽 여백 — 제목 줄과 본문이 같은 값을 써야 글자가 한 세로선에 선다. 좁은 화면은 여백을 줄여 내용에 양보한다 */
const PAD_X = 'px-7 sm:px-16'

/** 위아래 안쪽 여백 — 종이 윤곽이 둥글어서 네모 창보다 넉넉해야 안 답답하다 */
const PAD_TOP = 'pt-9'
const PAD_BOTTOM = 'pb-8 sm:pb-12'

/**
 * 종이 윤곽 path 를 0~1 좌표로 옮긴 것 (662×382 로 나눔) — 내용 클리핑용.
 * 스크롤되는 내용은 네모 상자라서, 종이의 둥근 모서리·굽은 아랫변 밖으로 비어져 나온다.
 * 같은 윤곽을 `clipPathUnits="objectBoundingBox"` 로 걸면 창이 아무리 늘어나도
 * (preserveAspectRatio="none" 과 같은 방식으로 따라 늘어나) 내용이 종이 안에만 그려진다.
 */
const PAPER_CLIP_D =
  'M.0831 .0262C.3021 .0157 .6798 .0196 .9215 .0288C.9668 .0471 .9879 .1571 .9834 .4974' +
  'C.9789 .8377 .9894 .9372 .9139 .9634C.6344 .9817 .3021 .9791 .0786 .9634' +
  'C.0302 .9424 .0121 .7853 .0136 .4843C.0151 .1832 .0332 .0393 .0831 .0262Z'

export function PaperWindow({
  title,
  aside,
  left,
  right,
  onClose,
  children,
}: {
  title: string
  /** 제목 오른쪽 보조 표시 — 예: `2 / 7` */
  aside?: ReactNode
  /** 창 왼쪽·오른쪽 세로 가운데 자리 — 넘김 화살표가 여기 붙는다 */
  left?: ReactNode
  right?: ReactNode
  onClose: () => void
  children: ReactNode
}) {
  const clipId = useId()
  return (
    /*
      max-h-full 은 부모(Modal 패널)의 높이가 확정일 때만 듣는데, 패널은 내용 크기를
      따르는 max-height 뿐이라 % 가 풀리지 않는다. 그래서 화면 높이(Modal 의 p-4 를 뺀
      값)로 직접 묶는다 — 이래야 안쪽 overflow-y-auto 가 실제로 스크롤을 만든다.
    */
    <div className="relative flex max-h-[calc(100dvh-2rem)] w-full flex-col font-ui text-ink">
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

      <svg aria-hidden className="absolute h-0 w-0">
        <clipPath id={clipId} clipPathUnits="objectBoundingBox">
          <path d={PAPER_CLIP_D} />
        </clipPath>
      </svg>

      {/* 제목 줄과 스크롤 본문을 종이 윤곽으로 자른다 — 이 래퍼가 창 전체를 덮어야 클립 좌표가 윤곽 svg 와 맞는다 */}
      <div className="flex min-h-0 flex-1 flex-col" style={{ clipPath: `url(#${clipId})` }}>
        {/* 제목 줄 — 구분선을 긋지 않는다. 종이 위에 적어 넣은 것처럼 둔다 */}
        <div className={`relative flex shrink-0 items-center ${PAD_TOP} ${PAD_X}`}>
          <h2 className="m-0 text-base font-semibold">{title}</h2>
          {aside ? <span className="ml-3 text-sm text-ink-muted">{aside}</span> : null}
          <div className="ml-auto">
            <CloseIconButton onClick={onClose} />
          </div>
        </div>

        <div className={`relative min-h-0 flex-1 overflow-y-auto overscroll-contain pt-4 ${PAD_BOTTOM} ${PAD_X}`}>
          {children}
        </div>
      </div>

      {/* 좌우 가운데 — 종이 안쪽 여백(PAD_X) 자리에 앉으므로 내용과 겹치지 않는다. 좁은 화면은 여백이 얇아 가장자리에 붙인다 */}
      {left ? <div className="absolute top-1/2 left-1 -translate-y-1/2 sm:left-4">{left}</div> : null}
      {right ? <div className="absolute top-1/2 right-1 -translate-y-1/2 sm:right-4">{right}</div> : null}
    </div>
  )
}
