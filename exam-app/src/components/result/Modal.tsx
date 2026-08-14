import { useEffect, useRef, type ReactNode } from 'react'

interface ModalProps {
  title: string
  /** 제목 오른쪽 보조 표시 — 예: `2 / 7` */
  aside?: ReactNode
  /** 본문 최대 폭(px) */
  width: number
  /**
   * 본문 영역의 클래스를 통째로 갈아끼운다. 기본은 여백을 둔 스크롤 영역이고,
   * 서명 창처럼 **내용이 껍데기를 꽉 채워야** 할 때만 넘긴다.
   */
  bodyClassName?: string
  /**
   * 제목 줄을 그리지 않는다 — 창이 내용 그 자체여야 할 때(서명 도화지).
   * `title` 은 그대로 살아 `aria-label` 로 읽힌다. **닫기 ✕ 도 함께 사라지므로**
   * Esc 와 바깥 누르기가 유일한 취소 수단이 된다.
   */
  hideHeader?: boolean
  /**
   * 껍데기가 **자기 모양을 그리지 않는다** — 테두리도 바탕도 두지 않고, 어둡게 깔기와
   * Esc·바깥 누르기만 맡는다. 내용이 스스로 모양을 갖고 있을 때 쓴다 (서명 창의 종이).
   */
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
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
