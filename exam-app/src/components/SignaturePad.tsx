import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { SignatureModal } from '../ui'
import { Modal } from './result/Modal'

/**
 * 성명 서명 — 이름을 글자로 받지 않고 마우스·손가락으로 직접 쓴다.
 *
 * 성명란(148×34)에 대고 쓰기는 어려우므로 칸을 누르면 넉넉한 창이 열리고,
 * 거기서 쓴 획이 표지·속지 헤더·성적통지표 세 곳에 같은 이미지로 들어간다.
 * 마우스와 터치는 Pointer 이벤트 하나로 함께 받는다.
 */

/** 내부 해상도 배수 — 선이 계단지지 않을 만큼 */
const SCALE = 2

/** 획 굵기 (논리 px) */
const STROKE = 2.4

/** 지우개 굵기 — 획을 따라가는 게 아니라 문질러 지우는 도구라 펜보다 굵다 */
const ERASER = 5

/** 도화지에서 쥘 수 있는 도구 */
export type Tool = 'pen' | 'eraser'

/**
 * 도화지 논리 크기 — 데스크톱·모바일 한 벌.
 * `ui/SignatureModal` 의 종이(662×382)에서 안쪽 여백 16(`inset-4`)을 뺀 값이다.
 * 비율이 어긋나면 캔버스가 상자 안에서 남거나 넘치므로 한쪽만 바꾸지 않는다.
 */
const PAD = { w: 630, h: 350 }

/**
 * 획의 테두리 상자만 남기고 잘라낸다 — 도화지째 넘기면 칸의 `object-contain` 이
 * 도화지 비율로 줄여 글씨가 콩알만 해진다.
 *
 * 획이 하나도 없으면 `null`. 빈 캔버스를 그대로 구우면 투명 PNG 도 값은 값이라
 * "서명했다"로 세어진다 — 지우개로 다 지운 경우가 여기로 온다.
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

  // 획 굵기만큼 숨통 — 딱 붙여 자르면 칸 안에서 글씨가 테두리에 닿는다
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
  /** 지금 쥔 도구. 창(`SignatureModal`)이 정하고 여기서는 긋는 방식만 바꾼다 */
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
  /** 직전에 내가 내보낸 dataURL — 부모가 돌려준 같은 값을 다시 그리면 획마다 깜빡인다 */
  const emitted = useRef<string | null>(null)

  /**
   * 붓 설정. 지우개는 `destination-out` 으로 알파를 깎는다 — 흰색 덧칠은 투명 배경에
   * 흰 얼룩을 남겨 `trimToInk` 가 잉크로 센다. 그려 넣는 경로(되살리기)에서는 반드시
   * `'pen'` 으로 부른다 — 지우개 상태의 `drawImage` 는 그 모양대로 파낸다.
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

  /** 표지가 `zoom` 으로 확대되면 offsetX 가 브라우저마다 다르다 — 실측 사각형 대비 비율로 환산 */
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
    // 넘어온 그림은 잘라낸 것이라 도화지와 비율이 다르다 — 비율을 지킨 채 가운데에 놓는다
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
   * iOS 사파리의 돋보기(루페) 차단 — CSS 로는 못 막고 `touchstart`·`touchmove` 의
   * 기본 동작을 막아야 한다. 리액트의 `onTouchStart` 는 passive 라 `preventDefault()`
   * 가 무시되므로 직접 `passive: false` 로 단다. 획은 Pointer 이벤트로 받으므로
   * 그리기에는 지장이 없다.
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
    // 기본 동작(글자 선택)을 막는다 — 선택은 문서 전체로 번져 획을 끊는다
    e.preventDefault()
    // 앞서 잡혀 있던 선택이 남아 있으면 긋는 내내 파랗게 떠 있다
    window.getSelection()?.removeAllRanges()
    /*
     * 칸 밖으로 나가도 획이 이어지게 포인터를 잡는다. 활성 포인터가 아닌 입력에서는
     * `NotFoundError` 를 던지므로 감싼다 — 못 잡아도 칸 안에서 긋는 데는 지장 없다.
     */
    try {
      canvas.setPointerCapture(e.pointerId)
    } catch {
      // 캡처 없이 진행 — 칸을 벗어나는 순간은 onPointerLeave 가 마무리한다
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

  return (
    // 창이 좁으면 함께 줄되 비율은 지킨다. 테두리는 없다 — 이 캔버스가 곧 창의 바닥이다
    <div
      className="relative w-full touch-none select-none"
      style={{ maxWidth: width, aspectRatio: `${width} / ${height}` }}
    >
      <canvas
        ref={canvasRef}
        width={width * SCALE}
        height={height * SCALE}
        aria-label="성명 서명란"
        /* 스크롤·글자 선택·길게 눌렀을 때 iOS 팝업 — 셋 다 꺼야 손가락 쓰기에 안 끼어든다 */
        className="h-full w-full cursor-crosshair touch-none select-none [-webkit-touch-callout:none]"
        /* 꾹 눌렀을 때 뜨는 메뉴 (안드로이드 크롬 등) */
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
 * 성명 칸에 붙는 표식 — 시험지 밖의 조작부(쪽 넘김)가 이 칸을 찾아 대신 누른다.
 * props 로 여닫지 않는 것은, 칸이 두 컴포넌트 갈래의 끝에 있어 상태를 끌어올리면
 * 중간 네 곳이 상관없는 prop 을 나르게 되기 때문이다.
 */
export const SIGNATURE_FIELD_ATTR = 'data-signature-field'

/** 표지의 성명 칸을 눌러 서명 창을 연다. 표지가 떠 있지 않으면 아무 일도 없다. */
export function openSignatureField() {
  document
    .querySelector<HTMLButtonElement>(`[${SIGNATURE_FIELD_ATTR}]`)
    ?.click()
}

/**
 * 표지의 성명 칸 — 누르면 서명 창이 열린다. 스스로 열지는 않는다 (표지부터 읽게 둔다).
 *
 * 창은 `createPortal` 로 `body` 에 붙인다 — 표지의 `zoom`·`transform` 안에 두면
 * `fixed` 인 창까지 같이 확대된다. 창 안의 획은 확인을 눌러야 칸에 담긴다 —
 * 그전까지는 `draft` 에만 머물러, 쓰다 말고 닫으면 원래 서명이 남는다.
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
  /** 창에서 그리는 중인 그림 — 확인을 눌러야 칸으로 넘어간다 */
  const [draft, setDraft] = useState<string | null>(value)
  /** 창을 다시 열면 늘 펜부터 */
  const [tool, setTool] = useState<Tool>('pen')

  /*
   * 창이 떠 있는 동안 문서 전체의 글자 선택을 끈다 — 선택은 문서 순서를 따라 번져,
   * 캔버스에서 시작한 끌기가 창 뒤 표지의 글자까지 파랗게 잡아냈다.
   * iOS 사파리는 접두사 속성을 보므로 둘 다 만지고, 닫을 때 원래 값으로 되돌린다.
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
        className="flex h-full items-center justify-center bg-transparent px-1 hover:bg-hover"
        style={{ width }}
      >
        {/* 비어 있을 때는 빈 칸 — 실제 시험지의 성명란도 빈 칸이다 */}
        {value ? (
          <SignatureMark src={value} className="max-h-full w-full object-contain" />
        ) : null}
      </button>

      {open
        ? createPortal(
            /*
             * 껍데기(`Modal`)는 어둡게 깔기·Esc·바깥 누르기만 맡고(`bare`), 종이의
             * 생김새는 킷(`ui/SignatureModal`)이 쥔다. 창 전체를 선택 금지로 두는 것은
             * 손이 캔버스를 조금 벗어나면 창 안의 글자가 잡혀 끌려 나오기 때문이다.
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
 * 다 쓴 서명을 읽기 전용으로 보여 준다 — 속지 헤더와 성적통지표의 성명 칸.
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
