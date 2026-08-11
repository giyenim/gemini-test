import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MOBILE_MEDIA_QUERY } from '../layout/constants'
import { Modal } from './result/Modal'

/**
 * 성명 서명 — 이름을 **글자로 받지 않고** 마우스·손가락으로 직접 쓴다.
 *
 * 실제 시험지의 성명란은 응시자가 손으로 적는 자리다. 입력 상자로 두면 그 자리만
 * 웹 폼이 되어 종이의 인상이 깨진다. 여기서 받은 획이 표지·속지 헤더·성적통지표
 * 세 곳에 같은 이미지로 들어간다.
 *
 * **쓰는 곳과 놓이는 곳을 나눈다.** 성명란은 148×34 라 거기에 대고 마우스로 이름을
 * 쓰기는 어렵다. 칸을 누르면 넉넉한 창이 열리고, 거기서 쓴 글씨가 칸에 담긴다.
 *
 * 도화지와 칸의 비율은 **같지 않아도 된다.** 넘길 때 획이 차지한 자리만 잘라내므로
 * (`trimToInk`) 칸에서는 잘라낸 그림이 제 비율대로 놓인다. 덕분에 모바일에서는
 * 도화지를 세로로 넉넉히 키울 수 있다 — 손가락으로 쓰려면 그 편이 낫다.
 *
 * 마우스와 터치를 따로 다루지 않는다 — Pointer 이벤트 하나로 둘 다 받는다.
 * `touch-none` 은 손가락으로 그을 때 화면이 같이 스크롤되는 것을 막는다.
 */

/** 내부 해상도 배수 — 화면에 보이는 크기의 몇 배로 굽는가 (선이 계단지지 않을 만큼) */
const SCALE = 2

/** 획 굵기 (논리 px) */
const STROKE = 2.4

/**
 * 서명 창의 도화지.
 *
 * 데스크톱은 성명 칸(148×34)의 6배 — 마우스로 긋기에 알맞은 가로로 긴 띠다.
 * 모바일은 그 비율을 그대로 쓰면 폭에 맞춰 줄었을 때 세로가 90px 밖에 남지 않아
 * 손가락으로 이름을 쓸 수 없다. 그래서 **모바일만 세로를 크게 잡는다.**
 * (425px 화면 기준 90px → 226px)
 *
 * 실제 화면 크기는 폭에 맞춰 줄어들고, 여기 적힌 값은 비율과 내부 해상도를 정한다.
 */
const PAD_DESKTOP = { w: 888, h: 204 }
const PAD_MOBILE = { w: 660, h: 380 }

/**
 * 그린 획의 테두리 상자만 남기고 잘라낸다.
 *
 * 도화지는 넓고 칸은 좁다. 도화지째 넘기면 칸의 `object-contain` 이 **도화지** 비율에
 * 맞춰 줄이므로, 세로로 키운 모바일 도화지에서는 글씨가 콩알만 해진다.
 * 획이 놓인 자리만 남기면 어디에 얼마나 크게 쓰든 칸을 꽉 채운다.
 *
 * 빈 도화지면 그대로 돌려준다 — 부를 일이 없지만 0×0 캔버스를 만들지 않기 위해서다.
 */
function trimToInk(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext('2d')!
  const { width: W, height: H } = canvas
  const px = ctx.getImageData(0, 0, W, H).data

  let minX = W, minY = H, maxX = -1, maxY = -1
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      if (px[(y * W + x) * 4 + 3] === 0) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  if (maxX < 0) return canvas.toDataURL('image/png')

  // 획 굵기만큼 숨통을 둔다 — 딱 붙여 자르면 칸 안에서 글씨가 테두리에 닿아 답답하다
  const pad = Math.ceil(STROKE * SCALE)
  const x0 = Math.max(0, minX - pad)
  const y0 = Math.max(0, minY - pad)
  const w = Math.min(W - 1, maxX + pad) - x0 + 1
  const h = Math.min(H - 1, maxY + pad) - y0 + 1

  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  out.getContext('2d')!.drawImage(canvas, x0, y0, w, h, 0, 0, w, h)
  return out.toDataURL('image/png')
}

interface SignaturePadProps {
  /** PNG dataURL. 아직 쓰기 전이면 null */
  value: string | null
  onChange: (dataUrl: string | null) => void
  /** 캔버스의 논리 크기 — 가로세로 비도 이 값에서 나온다 */
  width: number
  height: number
}

export function SignaturePad({ value, onChange, width, height }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  /**
   * 직전에 **내가 내보낸** dataURL. 부모가 그대로 돌려준 값을 다시 그리면
   * 획을 그을 때마다 캔버스를 지웠다 그리게 되어 깜빡인다.
   */
  const emitted = useRef<string | null>(null)
  const [hasInk, setHasInk] = useState(Boolean(value))

  const ctxOf = (c: HTMLCanvasElement) => {
    const ctx = c.getContext('2d')!
    ctx.strokeStyle = '#111'
    ctx.fillStyle = '#111'
    ctx.lineWidth = STROKE * SCALE
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    return ctx
  }

  /**
   * 표지는 `zoom` 으로 확대되어 그려진다. 그 아래에서 `offsetX` 는 브라우저마다
   * 배율을 반영하기도, 안 하기도 한다. 실제 그려진 사각형 대비 비율로 환산하면
   * 배율이 얼마든 어긋나지 않는다.
   */
  const posOf = (canvas: HTMLCanvasElement, clientX: number, clientY: number) => {
    const r = canvas.getBoundingClientRect()
    return {
      x: ((clientX - r.left) / r.width) * canvas.width,
      y: ((clientY - r.top) / r.height) * canvas.height,
    }
  }

  // 부모가 밖에서 값을 바꿨을 때만 캔버스를 되돌린다 (되돌아왔을 때 서명이 남아 있어야 한다)
  useEffect(() => {
    if (value === emitted.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = ctxOf(canvas)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!value) {
      setHasInk(false)
      return
    }
    const img = new Image()
    /*
     * 넘어온 그림은 **잘라낸 것**이라 도화지와 비율이 다르다. 도화지 가득 늘려 그리면
     * 창을 다시 열 때마다 글씨가 납작해지거나 길쭉해진다. 칸에서 쓰는 `object-contain`
     * 과 같은 규칙으로, 비율을 지킨 채 가운데에 놓는다.
     */
    img.onload = () => {
      const s = Math.min(canvas.width / img.width, canvas.height / img.height)
      const w = img.width * s
      const h = img.height * s
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h)
    }
    img.src = value
    emitted.current = value
    setHasInk(true)
  }, [value])

  /*
   * iOS 사파리의 돋보기(루페)를 막는다.
   *
   * 두 번 톡톡 치거나 꾹 누르면 사파리가 글자를 고르려고 물방울 모양 돋보기를 띄운다.
   * CSS 로는 막지 못한다 — `user-select: none` 도 `-webkit-touch-callout: none` 도
   * 사파리의 터치 제스처보다 뒤에 온다. 확실한 길은 `touchstart`·`touchmove` 의
   * **기본 동작 자체**를 막는 것이다.
   *
   * **리액트의 `onTouchStart` 로는 안 된다.** 리액트는 이 두 이벤트를 성능을 위해
   * passive 로 달아 두고, passive 리스너의 `preventDefault()` 는 조용히 무시된다.
   * 그래서 여기서 직접 `passive: false` 로 단다.
   *
   * 그림 그리기에는 지장이 없다 — 획은 Pointer 이벤트로 받고, 여기서 끄는 것은
   * 터치의 기본 동작(선택·돋보기·두 번 눌러 확대)뿐이다.
   */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const stop = (e: Event) => e.preventDefault()
    const opts = { passive: false }
    canvas.addEventListener('touchstart', stop, opts)
    canvas.addEventListener('touchmove', stop, opts)
    return () => {
      canvas.removeEventListener('touchstart', stop)
      canvas.removeEventListener('touchmove', stop)
    }
  }, [])

  const commit = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const url = trimToInk(canvas)
    emitted.current = url
    onChange(url)
  }, [onChange])

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget
    /*
     * 누르는 순간의 기본 동작을 막는다 — 이게 없으면 브라우저가 **글자 선택**을 시작한다.
     * 캔버스 자체는 고를 글자가 없지만 선택은 문서 전체에 걸쳐 번지므로, 획을 그으면
     * 창 안의 `확인` 같은 글자가 파랗게 잡히면서 획이 끊긴다. 이름이 잘 안 써지던 것이 이것이다.
     * (`touch-action: none` 은 스크롤·확대만 막고 선택은 막지 못한다.)
     */
    e.preventDefault()
    // 앞서 잡혀 있던 선택이 남아 있으면 획을 긋는 내내 파랗게 떠 있다. 시작할 때 털어 낸다
    window.getSelection()?.removeAllRanges()
    /*
     * 칸 밖으로 나가도 획이 이어지도록 포인터를 잡아 둔다.
     * **반드시 감싸야 한다** — 활성 포인터가 아닌 입력(합성 이벤트 등)에서는
     * `NotFoundError` 를 던지고, 이 줄이 핸들러 맨 앞이라 그 순간 획이 통째로 죽는다.
     * 잡지 못해도 칸 안에서 긋는 데에는 지장이 없다.
     */
    try {
      canvas.setPointerCapture(e.pointerId)
    } catch {
      // 캡처 없이 진행한다. 칸을 벗어나는 순간은 onPointerLeave 가 마무리한다
    }
    const ctx = ctxOf(canvas)
    const p = posOf(canvas, e.clientX, e.clientY)
    drawing.current = true
    last.current = p
    // 톡 찍기만 해도 점이 남아야 한다 (마침표·점획)
    ctx.beginPath()
    ctx.arc(p.x, p.y, (STROKE * SCALE) / 2, 0, Math.PI * 2)
    ctx.fill()
    setHasInk(true)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const canvas = e.currentTarget
    const ctx = ctxOf(canvas)
    const p = posOf(canvas, e.clientX, e.clientY)
    const l = last.current
    if (!l) return
    ctx.beginPath()
    ctx.moveTo(l.x, l.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
  }

  const onPointerEnd = () => {
    if (!drawing.current) return
    drawing.current = false
    last.current = null
    // 획이 끝날 때만 내보낸다 — 움직일 때마다 굽는 것은 비싸다
    commit()
  }

  // 지우기는 부모가 `value` 를 null 로 되돌려 처리한다 (위 useEffect 가 캔버스를 비운다)

  return (
    /*
     * 창이 좁으면 함께 줄되 가로세로 비는 지킨다 — 그래야 칸에 담길 때 획이 눌리지 않는다.
     * 테두리를 두르지 않는다. 이 캔버스가 곧 창의 바닥이라 선을 그으면 도화지가 아니라
     * 또 하나의 입력 상자로 보인다.
     */
    <div
      className="relative w-full touch-none select-none"
      style={{ maxWidth: width, aspectRatio: `${width} / ${height}` }}
    >
      <canvas
        ref={canvasRef}
        width={width * SCALE}
        height={height * SCALE}
        aria-label="성명 서명란"
        /*
         * `touch-none` 손가락 스크롤·확대 금지 / `select-none` 글자 선택 금지 /
         * `-webkit-touch-callout` 길게 눌렀을 때 뜨는 iOS 팝업 금지.
         * 셋 다 있어야 손가락으로 이름을 쓸 때 브라우저가 끼어들지 않는다.
         */
        className="h-full w-full cursor-crosshair touch-none select-none [-webkit-touch-callout:none]"
        /* 꾹 눌렀을 때 뜨는 메뉴(안드로이드 크롬 등) — 돋보기와 짝을 이루는 나머지 반쪽 */
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        /* 포인터를 잡지 못한 경우의 뒷정리 — 잡았다면 칸을 벗어나도 계속 이어야 한다 */
        onPointerLeave={(e) => {
          if (!e.currentTarget.hasPointerCapture(e.pointerId)) onPointerEnd()
        }}
      />
      {hasInk ? null : (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center font-ui text-[15px] text-ink-muted/35"
        >
          이 안에 이름을 쓰세요
        </span>
      )}
    </div>
  )
}

/**
 * 표지의 성명 칸 — **누르면 서명 창이 열린다.**
 *
 * 칸 자체에는 캔버스를 두지 않는다. 148×34 에 대고 마우스로 이름을 쓰기는 어렵고,
 * 손가락으로는 더 어렵다. 칸은 쓴 결과를 보여 주고 창을 여는 역할만 한다.
 *
 * 창은 `createPortal` 로 `body` 에 붙인다. 표지는 `zoom`(데스크톱)·`transform`(모바일)
 * 안에서 그려지므로, 그 안에 두면 `fixed` 인 창까지 같이 확대·축소된다.
 *
 * 창 안의 획은 **확인을 눌러야** 칸에 담긴다. 그전까지는 `draft` 에만 머물러,
 * 쓰다 말고 닫으면 원래 서명이 그대로 남는다.
 *
 * **비어 있으면 창을 열어 둔 채로 시작한다.** 표지가 열리는 순간이 곧 응시 시작이고,
 * 실제 시험도 성명부터 적고 들어간다. 이 칸이 놓이는 곳은 응시 중의 표지뿐이므로
 * (`onSignatureChange` 를 받은 `CoverSheet`) 그대로 "시작하면 바로"가 된다.
 */
export function SignatureField({
  value,
  onChange,
  width,
}: {
  value: string | null
  onChange: (dataUrl: string | null) => void
  /** 칸의 논리 폭 — 높이는 칸(`Field`)이 정한다 */
  width: number
}) {
  /*
   * 첫 렌더에서만 본다 — 효과가 아니라 초기값이라 창이 한 박자 늦게 뜨지 않는다.
   * 서명하지 않고 닫으면 다시 뜨지 않는다. 그때는 칸을 눌러 다시 연다.
   */
  const [open, setOpen] = useState(() => !value)
  /**
   * 창에서 그리는 중인 그림. 확인을 눌러야 칸으로 넘어간다.
   * `null` 로 되돌리면 `SignaturePad` 가 값이 바뀐 것을 보고 캔버스를 스스로 비운다.
   */
  const [draft, setDraft] = useState<string | null>(value)

  /*
   * 어느 도화지를 쓸지. 창이 떠 있는 중에 가로세로를 돌려도 따라오도록 지켜본다.
   * 획은 이미 그린 그림으로 남아 다시 그려지므로 (`value` → 캔버스 복원) 잃지 않는다.
   */
  const [pad, setPad] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(MOBILE_MEDIA_QUERY).matches
      ? PAD_MOBILE
      : PAD_DESKTOP,
  )
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MEDIA_QUERY)
    const update = () => setPad(mq.matches ? PAD_MOBILE : PAD_DESKTOP)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  /*
   * 창이 떠 있는 동안 **문서 전체**의 글자 선택을 끈다.
   *
   * 창 안만 막아서는 모자랐다. 선택은 한 요소에 갇히지 않고 **문서 순서를 따라 번지는데**,
   * 창은 포털로 `body` 끝에 붙어 시험지보다 뒤에 있다. 그래서 캔버스에서 시작한 끌기가
   * 창 뒤에 깔린 표지의 글자(`이지스퍼블리싱평가원`)까지 범위에 넣어 파랗게 잡아냈다.
   * 이름을 쓰는 내내 뒤에서 글자가 끌려 나오던 것이 이것이다.
   *
   * iOS 사파리는 아직 접두사가 붙은 속성을 본다. 원래 값으로 되돌려 두어야
   * 창을 닫은 뒤 다른 화면(성적표 등)에서 글자를 고를 수 있다.
   */
  useEffect(() => {
    if (!open) return
    const style = document.body.style
    const prev = { plain: style.userSelect, webkit: style.webkitUserSelect }
    style.userSelect = 'none'
    style.webkitUserSelect = 'none'
    return () => {
      style.userSelect = prev.plain
      style.webkitUserSelect = prev.webkit
    }
  }, [open])

  const openPad = () => {
    setDraft(value)
    setOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={openPad}
        aria-label={value ? '성명 다시 서명하기' : '성명 서명하기'}
        /* 호버 회색은 쪽 넘김·제출 버튼과 같은 값이다 — 누를 수 있는 곳은 다 같은 반응을 준다.
           `bg-selected`(답 고른 칸의 파란기)를 쓰면 여기만 다른 뜻으로 읽힌다 */
        className="flex h-full items-center justify-center bg-transparent px-1 hover:bg-[#f5f5f5]"
        style={{ width }}
      >
        {/*
          비어 있을 때 아무것도 넣지 않는다 — 실제 시험지의 성명란도 빈 칸이다.
          누를 수 있다는 것은 넘김 버튼의 `이름을 써 주세요` 와 칸의 hover 가 알려 준다.
        */}
        {value ? (
          <SignatureMark src={value} className="max-h-full w-full object-contain" />
        ) : null}
      </button>

      {open
        ? createPortal(
            /*
             * 창은 **도화지 한 장** 그 자체다. 제목 줄도 본문 여백도 두지 않아 캔버스가
             * 껍데기를 꽉 채우고, 지우기·닫기·확인만 그 위에 얹는다.
             * 제목이 사라져도 `title` 은 `aria-label` 로 남아 화면 낭독기에 읽힌다.
             * 껍데기의 닫기 ✕ 대신 도화지 위의 ✕ 를 쓴다 (Esc·바깥 누르기도 그대로).
             */
            <Modal
              title="성명 서명"
              width={pad.w + 2}
              hideHeader
              /*
               * 창 전체를 선택 금지로 둔다. 이름을 쓰다 손이 캔버스를 조금 벗어나면
               * 그 순간부터 창 안의 글자가 잡혀 끌려 나오기 때문이다 — 획은 캔버스가
               * 계속 받고 있어도 화면은 글자를 고르는 중처럼 보인다.
               */
              bodyClassName="min-h-0 flex-1 overflow-hidden touch-none select-none"
              onClose={() => setOpen(false)}
            >
              <div className="relative">
                <SignaturePad
                  /* 도화지가 바뀌면 캔버스를 새로 잡는다 — 배경 크기가 바뀐 채로 이어 그리면 획이 어긋난다 */
                  key={`${pad.w}x${pad.h}`}
                  value={draft}
                  onChange={setDraft}
                  width={pad.w}
                  height={pad.h}
                />
                {/*
                  지우기·닫기는 아이콘만, 오른쪽 위. 테두리를 두르면 도화지에 상자가 얹힌다.

                  모바일에서 한 단계 작다. 창은 성명 칸의 가로세로 비를 지키느라 폭에
                  맞춰 줄어드는데(425px 화면에서 캔버스가 90px), 데스크톱 크기 그대로 두면
                  버튼 하나가 도화지 높이의 36% 를 먹어 이름 쓸 자리를 가린다.
                  `md:` 는 앱이 모바일로 보는 경계(767px)와 정확히 맞물린다.
                */}
                <div className="absolute top-1 right-1.5 flex items-center gap-0.5 md:top-2.5 md:right-3 md:gap-1">
                  <button
                    type="button"
                    onClick={() => setDraft(null)}
                    disabled={!draft}
                    aria-label="서명 지우기"
                    title="지우고 다시 쓰기"
                    className="flex h-6 w-6 items-center justify-center bg-transparent text-ink-muted enabled:hover:text-ink disabled:cursor-not-allowed disabled:opacity-25 md:h-8 md:w-8"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden
                      className="h-[14px] w-[14px] md:h-[18px] md:w-[18px]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 14 4 9l5-5" />
                      <path d="M4 9h11a5 5 0 0 1 0 10H8" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="닫기"
                    title="닫기"
                    className="flex h-6 w-6 items-center justify-center bg-transparent text-ink-muted hover:text-ink md:h-8 md:w-8"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden
                      className="h-[14px] w-[14px] md:h-[18px] md:w-[18px]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M6 6 18 18M18 6 6 18" />
                    </svg>
                  </button>
                </div>

                {/* 확인 — 쪽 넘김 버튼과 같은 결(시험지 밖 글꼴, 테두리 없음) */}
                <button
                  type="button"
                  onClick={() => {
                    onChange(draft)
                    setOpen(false)
                  }}
                  disabled={!draft}
                  className="absolute right-1.5 bottom-1 bg-transparent px-1.5 py-0.5 font-ui text-[12px] text-ink enabled:hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-30 md:right-3 md:bottom-2.5 md:px-2 md:py-1 md:text-[14px]"
                >
                  확인
                </button>
              </div>
            </Modal>,
            document.body,
          )
        : null}
    </>
  )
}

/**
 * 다 쓴 서명을 **읽기 전용**으로 보여 준다 — 속지 헤더와 성적통지표의 성명 칸.
 * 칸 크기가 저마다 달라 `object-contain` 으로 비율만 지키고 크기는 부모가 정한다.
 */
export function SignatureMark({
  src,
  className,
}: {
  src?: string | null
  className?: string
}) {
  if (!src) return null
  return <img src={src} alt="" className={className ?? 'h-full w-full object-contain'} />
}
