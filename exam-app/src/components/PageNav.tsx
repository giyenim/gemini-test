import { useEffect, useState } from 'react'
import { PageTurnButton } from '../ui'
import { openSignatureField } from './SignaturePad'

/** 좌우 여백 (px) */
const EDGE = 16

/**
 * 세로 스크롤바 폭을 잰다 — 스테이지가 `scrollbar-gutter: stable` 로 잡아 둔 자리를
 * `fixed` 인 이 nav 가 덮으므로, 그만큼 더하지 않으면 오른쪽 버튼만 끝에 붙어 보인다.
 * 폭은 OS·브라우저마다 달라 (윈도 크롬 15px, 맥 오버레이 0px) 상수로 박지 않고 잰다.
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
 * 쪽 넘김 — 화면 좌우 가장자리, 세로 가운데에 하나씩. 생김새는 UI 킷
 * (`ui/PageTurnButton`)이 쥐고 여기서는 자리만 잡는다.
 *
 * `nav` 는 화면을 덮지만 `pointer-events-none` 이라 시험지 클릭을 가로채지 않는다.
 * 양 끝에서는 버튼을 숨기지 않고 문구를 바꾼다 (`첫 페이지` / `마지막 페이지`) —
 * 사라지게 두면 남은 버튼이 자리를 옮긴다.
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
          /* 서명을 부르는 동안만 점을 노랑으로 — 쪽을 넘기는 것과 다른 일이라서 */
          dotClass={blocked ? 'fill-yellow-300' : undefined}
          onClick={blocked ? openSignatureField : () => onChange(index + 1)}
        >
          {isLast ? '마지막 페이지' : blocked ? '이름을 쓰세요' : '다음 페이지'}
        </PageTurnButton>
      </div>
    </nav>
  )
}
