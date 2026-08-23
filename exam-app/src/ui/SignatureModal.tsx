import type { ReactNode } from 'react'
import { CloseIconButton, IconButton } from './IconButton'

export type SignatureTool = 'pen' | 'eraser'

/**
 * 서명 창의 종이 한 장 — 킷은 생김새만 쥔다.
 * 창을 띄우는 일(어둡게 깔기·Esc·바깥 누르기)은 쓰는 쪽이 `Modal` 로 감싸고,
 * 도화지는 `children` 으로 받아 가운데 자리(630×350)에 놓기만 한다.
 */
export function SignatureModal({
  tool,
  onToolChange,
  onClose,
  onConfirm,
  confirmDisabled,
  children,
}: {
  tool: SignatureTool
  onToolChange: (tool: SignatureTool) => void
  onClose: () => void
  onConfirm: () => void
  confirmDisabled?: boolean
  children: ReactNode
}) {
  return (
    /*
     * viewBox 를 실제 크기와 1:1 로 둔다 — 좌표가 곧 px 이라 선 옮기기가 쉽다.
     * `aspect` 는 늘 viewBox 와 같아야 한다 — 어긋나면 둥근 모서리가 타원이 된다.
     */
    <div className="relative aspect-662/382 w-full max-w-[662px]">
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full text-ink"
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

      {/*
        도화지 자리. `inset-4` 를 바꾸면 `SignaturePad` 의 `PAD`(630×350)도 같이
        옮겨야 한다 — 비율이 어긋나면 캔버스가 상자 안에서 남거나 넘친다.
      */}
      <div className="absolute inset-4">{children}</div>

      {/*
        아이콘은 Lucide 의 pen·eraser·x 좌표를 조금씩 어긋내 손그림에 맞췄다.
        패키지는 넣지 않는다 — 글리프 셋 때문에 의존성을 늘릴 일이 아니다.
      */}
      <div className="absolute top-5 left-12 flex gap-1">
        <IconButton
          label="펜"
          selected={tool === 'pen'}
          onClick={() => onToolChange('pen')}
        >
          <path d="M15.9 4.1C17.1 5.1 19 7 20 8.2C16.4 11.9 12.3 16 8.9 19.2C7.3 19.6 5.5 20 3.9 20.3C4.2 18.7 4.6 16.8 5 15.2C8.4 11.9 12.4 7.7 15.9 4.1Z" />
          <path d="M12.4 7.6Q14.4 9.7 16.5 11.7" />
        </IconButton>
        <IconButton
          label="지우개"
          selected={tool === 'eraser'}
          onClick={() => onToolChange('eraser')}
        >
          {/* Lucide 의 바닥선은 그림자처럼 읽혀 뺐다 — 대신 블록을 `Z` 로 닫는다 */}
          <path d="M8.2 20.4L3.6 15.6C2.9 14.8 2.9 13.7 3.6 13L12.9 3.7C13.7 3 14.8 3 15.5 3.7L20.6 8.8C21.3 9.6 21.3 10.7 20.6 11.4L12.1 20.2Z" />
          <path d="M5.4 11.2Q9.5 15.3 13.6 19.3" />
        </IconButton>
      </div>

      <div className="absolute top-5 right-12">
        <CloseIconButton onClick={onClose} />
      </div>

      {/* 확인 — 아래쪽 가운데, 테두리 없이 글자만. 호버 색은 킷 공통 노랑 */}
      <div className="absolute inset-x-0 bottom-6 flex justify-center">
        <button
          type="button"
          onClick={onConfirm}
          disabled={confirmDisabled}
          className="bg-transparent px-3 py-1 font-ui text-[15px] text-ink hover:text-yellow-300 disabled:text-gray-300 disabled:hover:text-gray-300"
        >
          확인
        </button>
      </div>
    </div>
  )
}
