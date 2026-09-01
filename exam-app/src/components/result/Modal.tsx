import { useEffect, useRef, type ReactNode } from 'react'

interface ModalProps {
  title: string
  /** 제목 오른쪽 보조 표시 — 예: `2 / 7` */
  aside?: ReactNode
  /** 본문 최대 폭(px) */
  width: number
  /** 본문 영역 클래스를 통째로 갈아끼운다 — 내용이 껍데기를 꽉 채워야 할 때만 */
  bodyClassName?: string
  /**
   * 제목 줄을 그리지 않는다. `title` 은 `aria-label` 로 남지만 닫기 ✕ 도 사라지므로
   * Esc 와 바깥 누르기가 유일한 취소 수단이 된다.
   */
  hideHeader?: boolean
  /** 테두리·바탕을 두지 않는다 — 내용이 스스로 모양을 가질 때 (서명 창의 종이) */
  bare?: boolean
  onClose: () => void
  children: ReactNode
}

/**
 * 결과 화면의 팝업 껍데기 (채점표 / 오답노트 공용).
 *
 * 두 팝업은 **겹쳐 띄우지 않고 갈아끼운다** (RESULT-PAGE.md §3). 그래서 이 컴포넌트는
 * 열림 상태를 스스로 갖지 않고, 부모가 어느 팝업을 그릴지 정한다.
 */
export function Modal({
  title,
  aside,
  width,
  bodyClassName,
  hideHeader,
  bare,
  onClose,
  children,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    // 뒤 화면이 같이 스크롤되지 않게 잠근다
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    /*
      `inset-0` 만 두면 상자 높이가 **레이아웃 뷰포트**(주소 표시줄이 보일 때 화면보다
      큰 값)로 잡힌다. 그 안에서 가운데 정렬하면 창이 보이는 화면의 가운데보다 아래로
      내려앉아 **아래 여백만 좁아 보인다** — 모바일에서만 나던 증상이다.
      `h-dvh` 로 지금 보이는 높이에 묶는다 (PaperWindow 의 `max-h-[calc(100dvh-2rem)]`
      과 같은 기준 — `2rem` 은 아래 `p-4` 의 위아래 합이다).
    */
    <div
      className="fixed inset-0 z-50 flex h-dvh items-center justify-center bg-black/45 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal
        aria-label={title}
        tabIndex={-1}
        className={`flex max-h-full w-full flex-col outline-none ${
          bare ? '' : 'overflow-hidden border border-line bg-white'
        }`}
        style={{ maxWidth: width }}
      >
        {hideHeader ? null : (
          <header className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3">
            <h2 className="m-0 font-serif text-[15px] font-bold">{title}</h2>
            {aside ? (
              <span className="ml-auto font-serif text-[12.5px] text-ink-muted">{aside}</span>
            ) : null}
            <button
              type="button"
              aria-label="닫기"
              onClick={onClose}
              className={`${aside ? '' : 'ml-auto'} border-0 bg-transparent px-1 font-serif text-[17px] leading-none text-ink-muted hover:text-ink`}
            >
              ✕
            </button>
          </header>
        )}
        <div
          className={
            bodyClassName ?? 'min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4'
          }
        >
          {children}
        </div>
      </div>
    </div>
  )
}
