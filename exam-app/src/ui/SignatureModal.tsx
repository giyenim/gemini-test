import type { ReactNode } from 'react'

export type SignatureTool = 'pen' | 'eraser'

/**
 * 아이콘 담는 버튼 — 테두리 없이 글리프만. 손이 닿는 자리는 글리프보다 넓게 둔다.
 * 호버 색은 확인 버튼·쪽 넘김 점과 같다.
 *
 * `selected` 는 도구를 고르는 버튼(펜·지우개)에만 준다. 고른 것은 잉크,
 * 고르지 않은 것은 회색 — 노랑은 호버가 이미 쓰고 있어 겹치지 않게 둔다.
 * `undefined` 면 고르는 버튼이 아니라는 뜻이고 늘 잉크다 (닫기).
 */
function IconButton({
  label,
  selected,
  onClick,
  children,
}: {
  label: string
  selected?: boolean
  onClick?: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={selected}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center bg-transparent hover:text-yellow-300 ${
        selected === false ? 'text-gray-300' : 'text-ink'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </button>
  )
}

/**
 * 서명 창의 **종이 한 장.**
 *
 * 창을 띄우는 일(어둡게 깔기·Esc·바깥 누르기)은 여기서 하지 않는다 — 쓰는 쪽이
 * `Modal` 로 감싼다. 킷은 생김새만 쥔다.
 *
 * 도화지는 `children` 으로 받는다. 캔버스가 어떻게 그리는지는 킷이 알 바가 아니고,
 * 여기서는 그것이 놓일 자리(가운데 660×380)만 비워 둔다.
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
      viewBox 를 실제 크기와 1:1 로 둔다 — 좌표가 곧 px 이라 선을 옮길 때 눈대중과
      숫자가 어긋나지 않는다. `aspect` 는 늘 viewBox 와 같아야 한다. 어긋나면 그림이
      한쪽으로만 늘어나 둥근 모서리가 타원이 된다.

      도화지는 데스크톱·모바일 한 벌이다. 예전 데스크톱 값(888×204)은 가로로 긴
      슬롯이라 이름을 쓸 세로가 없었다.
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
        도화지 — 종이 안쪽을 다 쓴다. 아이콘과 확인은 그 위에 얹힌다.
        `inset-4` 를 바꾸면 `SignaturePad` 의 `PAD`(630×350)도 같이 옮겨야 한다 —
        비율이 어긋나면 캔버스가 상자 안에서 남거나 넘친다.
      */}
      <div className="absolute inset-4">{children}</div>

      {/*
        아이콘은 Lucide 의 pen · eraser · x 를 출발점으로 삼되 좌표를 조금씩 어긋내고
        끝을 둥글렸다. 자로 그은 24×24 격자 그대로 두면 손그림 상자 안에서 저것만
        붙여넣은 것처럼 보인다. 패키지는 넣지 않는다 — 글리프 셋 때문에 의존성을
        늘릴 일이 아니고, 이 저장소는 원래 path 를 직접 쓴다.
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
          {/*
            Lucide `eraser` 의 바닥선(지우개가 놓인 면)은 뺐다 — 여기서는 아래
            그림자처럼 읽혔다. 대신 블록을 `Z` 로 닫아 바닥을 만든다.
          */}
          <path d="M8.2 20.4L3.6 15.6C2.9 14.8 2.9 13.7 3.6 13L12.9 3.7C13.7 3 14.8 3 15.5 3.7L20.6 8.8C21.3 9.6 21.3 10.7 20.6 11.4L12.1 20.2Z" />
          <path d="M5.4 11.2Q9.5 15.3 13.6 19.3" />
        </IconButton>
      </div>

      <div className="absolute top-5 right-12">
        <IconButton label="닫기" onClick={onClose}>
          <path d="M6.5 6Q12 11.5 17.8 17.9" />
          <path d="M17.9 6.2Q12.2 12 6.2 17.8" />
        </IconButton>
      </div>

      {/* 확인 — 아래쪽 가운데. 테두리 없이 글자만 */}
      <div className="absolute inset-x-0 bottom-6 flex justify-center">
        <button
          type="button"
          onClick={onConfirm}
          disabled={confirmDisabled}
          /* 호버 색은 쪽 넘김 버튼의 점과 같다 — 킷 안에서 "살아 있음"은 한 색으로 */
          className="bg-transparent px-3 py-1 font-ui text-[15px] text-ink hover:text-yellow-300 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:text-gray-300"
        >
          확인
        </button>
      </div>
    </div>
  )
}
