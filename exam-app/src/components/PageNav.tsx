import { useEffect, useState } from 'react'
import { PageTurnButton } from '../ui'
import { openSignatureField } from './SignaturePad'

/** 좌우 여백 (px) */
const EDGE = 16

/**
 * 세로 스크롤바 폭을 잰다.
 *
 * 시험지 스테이지가 `scrollbar-gutter: stable` 로 오른쪽에 스크롤바 자리를 **늘**
 * 잡아 두는데, 이 `nav` 는 `fixed` 라 그 위까지 덮는다. 좌우에 같은 값을 주면
 * 오른쪽은 그 대부분이 스크롤바에 먹혀 버튼이 끝에 붙은 것처럼 보인다.
 *
 * 폭은 OS·브라우저마다 다르다 (윈도 크롬 15px, 맥 오버레이 스크롤바 0px).
 * 그래서 상수로 박지 않고 잰다.
 */
function useScrollbarWidth() {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const probe = document.createElement('div')
    probe.style.cssText =
      'position:absolute;top:-9999px;width:100px;height:100px;overflow:scroll'
    document.body.appendChild(probe)
    setWidth(probe.offsetWidth - probe.clientWidth)
    probe.remove()
  }, [])
  return width
}

interface PageNavProps {
  /** 0부터. 0 = 표지 */
  index: number
  total: number
  onChange: (next: number) => void
  /** 표지에서 아직 서명하지 않았을 때 — 다음으로 넘기지 않고 이유를 대신 보여 준다 */
  needsSignature?: boolean
}

/**
 * 쪽 넘김 — **화면 좌우 가장자리**, 세로 가운데에 하나씩.
 *
 * 시험지 아래에 붙여 두었을 때는 쪽을 끝까지 읽어 내려야 손이 닿았다. 지금은 화면에
 * 고정해 두어 어느 쪽을 보고 있든 같은 자리에 있다.
 *
 * `nav` 는 화면을 덮지만 `pointer-events-none` 이라 시험지 클릭을 가로채지 않는다.
 * 버튼만 `pointer-events-auto` 로 되살린다.
 *
 * 지금 몇 쪽인지는 시험지 푸터의 쪽 번호 칸이 이미 알려 주므로 여기서 또 세지 않는다.
 * 양 끝에서는 숨기지 않고 **문구를 바꿔** 지금 어디인지 알린다 (`첫 페이지` /
 * `마지막 페이지`). 사라지게 두면 남은 버튼이 자리를 옮긴다.
 *
 * 버튼 생김새는 UI 킷이 쥐고 있다 (`ui/PageTurnButton`). 여기서는 **자리만** 잡는다.
 */
export function PageNav({ index, total, onChange, needsSignature }: PageNavProps) {
  const isFirst = index <= 0
  const isLast = index >= total - 1
  // 서명은 표지에서만 막는다. 뒤로 가는 길은 언제나 열어 둔다
  const blocked = Boolean(needsSignature) && !isLast
  const scrollbar = useScrollbarWidth()

  return (
    <nav
      aria-label="쪽 넘김"
      className="pointer-events-none fixed inset-0 z-10 flex items-center justify-between"
      /* 오른쪽만 스크롤바 폭을 더한다 — 그래야 눈에 보이는 여백이 좌우 같아진다 */
      style={{ paddingLeft: EDGE, paddingRight: EDGE + scrollbar }}
    >
      <div className="pointer-events-auto">
        <PageTurnButton disabled={isFirst} onClick={() => onChange(index - 1)}>
          {isFirst ? '첫 페이지' : '이전 페이지'}
        </PageTurnButton>
      </div>

      <div className="pointer-events-auto">
        {/*
          이름을 아직 안 썼을 때는 넘기는 대신 **서명 창을 연다.** 막아 놓고 이유만
          알리면 어디를 눌러야 할지 다시 찾아야 한다 — 알린 자리가 곧 여는 자리다.
        */}
        <PageTurnButton
          disabled={isLast}
          onClick={blocked ? openSignatureField : () => onChange(index + 1)}
        >
          {isLast ? '마지막 페이지' : blocked ? '이름을 쓰세요' : '다음 페이지'}
        </PageTurnButton>
      </div>
    </nav>
  )
}
