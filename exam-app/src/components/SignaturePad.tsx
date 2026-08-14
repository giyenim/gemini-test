import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { SignatureModal } from '../ui'
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
 * 지우개 굵기 (논리 px). 펜보다 두 배쯤 굵다 — 획 한 가닥을 따라가며 지우는 것이
 * 아니라 문질러 지우는 도구다. 손가락으로 쓰는 모바일에서는 정밀하게 짚지 못하므로
 * 펜과 같은 굵기로 두면 지우는 데만 한참 걸린다.
 */
const ERASER = 5

/** 도화지에서 쥘 수 있는 도구 */
export type Tool = 'pen' | 'eraser'

/**
 * 서명 창의 도화지 — **데스크톱·모바일 한 벌.**
 *
 * 예전에는 화면에 따라 둘로 갈랐다. 데스크톱은 성명 칸(148×34)의 6배인 888×204 라
 * 가로로 긴 슬롯이었는데, 마우스로 긋기에도 세로가 모자랐고 무엇보다 창이 화면마다
 * 다른 물건처럼 보였다. 손가락 기준으로 잡아 둔 모바일 쪽 비율이 양쪽에 다 맞다.
 *
 * 실제 화면 크기는 폭에 맞춰 줄어들고, 여기 적힌 값은 비율과 내부 해상도를 정한다.
 * `ui/SignatureModal` 의 종이(662×382)에서 안쪽 여백 16 을 뺀 크기다 —
 * **비율이 어긋나면 캔버스가 상자 안에서 남거나 넘치므로 한쪽만 바꾸지 않는다.**
 */
const PAD = { w: 630, h: 350 }

/**
 * 그린 획의 테두리 상자만 남기고 잘라낸다.
 *
 * 도화지는 넓고 칸은 좁다. 도화지째 넘기면 칸의 `object-contain` 이 **도화지** 비율에
 * 맞춰 줄이므로, 세로로 키운 모바일 도화지에서는 글씨가 콩알만 해진다.
 * 획이 놓인 자리만 남기면 어디에 얼마나 크게 쓰든 칸을 꽉 채운다.
 *
 * **획이 하나도 없으면 `null` 을 돌려준다.** 지우개로 다 지운 경우가 여기로 온다.
 * 빈 캔버스를 그대로 구우면 투명한 PNG 한 장이 나오는데, 그것도 값은 값이라
 * "서명했다"로 세어져 쪽 넘김이 열리고 성적표에 빈 그림이 실린다.
 */
function trimToInk(canvas: HTMLCanvasElement): string | null {
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
  if (maxX < 0) return null

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
  /** 지금 쥔 도구. 창(`SignatureModal`)이 정하고 여기서는 굿는 방식만 바꾼다 */
  tool?: Tool
}

export function SignaturePad({
  value,
  onChange,
  width,
  height,
  tool = 'pen',
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  /**
   * 직전에 **내가 내보낸** dataURL. 부모가 그대로 돌려준 값을 다시 그리면
   * 획을 그을 때마다 캔버스를 지웠다 그리게 되어 깜빡인다.
   */
  const emitted = useRef<string | null>(null)

  /**
   * 붓 설정.
   *
   * 지우개는 흰색으로 덧칠하지 않고 `destination-out` 으로 **알파를 깎는다.**
   * 이 도화지는 배경이 투명이라 흰색으로 칠하면 흰 얼룩이 남고, `trimToInk` 가
   * 그 얼룩까지 잉크로 세어 잘라내는 범위가 엉뚱해진다.
   *
   * 되살리기처럼 **그려 넣는** 경로에서는 반드시 `'pen'` 으로 부른다 — 지우개 상태로
   * `drawImage` 를 하면 그림이 들어가는 대신 그 모양대로 파인다.
   */
  const ctxOf = (c: HTMLCanvasElement, mode: Tool) => {
    const ctx = c.getContext('2d')!
    const erasing = mode === 'eraser'
    ctx.globalCompositeOperation = erasing ? 'destination-out' : 'source-over'
    ctx.strokeStyle = '#111'
    ctx.fillStyle = '#111'
    ctx.lineWidth = (erasing ? ERASER : STROKE) * SCALE
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
    const ctx = ctxOf(canvas, 'pen')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!value) return
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
    const ctx = ctxOf(canvas, tool)
    const p = posOf(canvas, e.clientX, e.clientY)
    drawing.current = true
    last.current = p
    // 톡 찍기만 해도 점이 남아야 한다 (마침표·점획). 지우개면 그만큼 파인다
    ctx.beginPath()
    ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2)
    ctx.fill()
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const canvas = e.currentTarget
    const ctx = ctxOf(canvas, tool)
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
    </div>
  )
}

/**
 * 성명 칸에 붙는 표식. 시험지 **밖**의 조작부(쪽 넘김)가 이 칸을 찾아 대신 누른다.
 *
 * props 로 창을 여닫지 않는 것은, 이 칸이 `App → ExamSheet → CoverSheet` 와
 * `App → MobileExamView → CoverSheet` 두 갈래 끝에 있어 상태를 끌어올리면 중간
 * 네 곳이 아무 상관 없는 prop 을 나르게 되기 때문이다. 여는 길은 한 곳(`openPad`)
 * 뿐이므로 그 버튼을 그대로 누른다.
 */
export const SIGNATURE_FIELD_ATTR = 'data-signature-field'

/** 표지의 성명 칸을 눌러 서명 창을 연다. 표지가 떠 있지 않으면 아무 일도 없다. */
export function openSignatureField() {
  document
    .querySelector<HTMLButtonElement>(`[${SIGNATURE_FIELD_ATTR}]`)
    ?.click()
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
 * **스스로 열지 않는다.** 표지에 들어서자마자 창이 덮으면 표지를 읽기도 전에
 * 이름부터 요구받는다. 여는 길은 둘이다 — 성명 칸을 누르거나, 쪽 넘김의
 * `이름을 쓰세요` 를 누르거나 (`PageNav` 가 `SIGNATURE_FIELD_ATTR` 로 이 칸을 찾는다).
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
  const [open, setOpen] = useState(false)
  /**
   * 창에서 그리는 중인 그림. 확인을 눌러야 칸으로 넘어간다.
   * `null` 로 되돌리면 `SignaturePad` 가 값이 바뀐 것을 보고 캔버스를 스스로 비운다.
   */
  const [draft, setDraft] = useState<string | null>(value)
  /** 창을 다시 열면 늘 펜부터 — 지우개를 쥔 채 닫았다고 다음에도 지우개일 이유가 없다 */
  const [tool, setTool] = useState<Tool>('pen')

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
    setTool('pen')
    setOpen(true)
  }

  return (
    <>
      <button
        type="button"
        {...{ [SIGNATURE_FIELD_ATTR]: '' }}
        onClick={openPad}
        aria-label={value ? '성명 다시 서명하기' : '성명 서명하기'}
        /* 호버 회색은 쪽 넘김·제출 버튼과 같은 값이다 — 누를 수 있는 곳은 다 같은 반응을 준다.
           `bg-selected`(답 고른 칸의 파란기)를 쓰면 여기만 다른 뜻으로 읽힌다 */
        className="flex h-full items-center justify-center bg-transparent px-1 hover:bg-[#f5f5f5]"
        style={{ width }}
      >
        {/*
          비어 있을 때 아무것도 넣지 않는다 — 실제 시험지의 성명란도 빈 칸이다.
          누를 수 있다는 것은 넘김 버튼의 `이름을 쓰세요` 와 칸의 hover 가 알려 준다.
        */}
        {value ? (
          <SignatureMark src={value} className="max-h-full w-full object-contain" />
        ) : null}
      </button>

      {open
        ? createPortal(
            /*
             * 껍데기(`Modal`)는 어둡게 깔기와 Esc·바깥 누르기만 맡는다. 종이의 생김새는
             * 킷(`ui/SignatureModal`)이 쥐고 있으므로 `bare` 로 껍데기의 테두리·바탕을
             * 끈다. 제목 줄은 없지만 `title` 이 `aria-label` 로 남아 낭독기에 읽힌다.
             *
             * 창 전체를 선택 금지로 둔다. 이름을 쓰다 손이 캔버스를 조금 벗어나면
             * 그 순간부터 창 안의 글자가 잡혀 끌려 나오기 때문이다 — 획은 캔버스가
             * 계속 받고 있어도 화면은 글자를 고르는 중처럼 보인다.
             */
            <Modal
              title="성명 서명"
              width={PAD.w + 32}
              hideHeader
              bare
              bodyClassName="min-h-0 flex-1 touch-none select-none"
              onClose={() => setOpen(false)}
            >
              <SignatureModal
                tool={tool}
                onToolChange={setTool}
                onClose={() => setOpen(false)}
                onConfirm={() => {
                  onChange(draft)
                  setOpen(false)
                }}
                confirmDisabled={!draft}
              >
                <SignaturePad
                  value={draft}
                  onChange={setDraft}
                  width={PAD.w}
                  height={PAD.h}
                  tool={tool}
                />
              </SignatureModal>
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
