import type { CSSProperties, ReactNode } from 'react'
import type { PlacedItem } from '../layout/types'
import { COLUMN_BOTTOM, COLUMN_TOP } from '../layout/constants'

interface SheetColumnProps {
  items: PlacedItem[]
  renderItem: (item: PlacedItem) => ReactNode
}

/**
 * 아이템 사이 여백.
 *
 * 제출 블록만 예외로 단 맨 아래에 붙인다 (`marginTop: auto`가 남는 세로를 다 먹는다).
 * 최소 간격은 `paddingTop`이 지키므로 단이 빠듯해도 마지막 문제에 붙지 않는다.
 * 이때 블록 높이는 gap + 버튼 = `SUBMIT_ACTION_BLOCK`으로, 패킹이 잡아 둔 값과 같다.
 */
function itemSpacing(item: PlacedItem, gapBefore: number): CSSProperties | undefined {
  if (item.type === 'submit-action') {
    return { marginTop: 'auto', paddingTop: gapBefore }
  }
  return gapBefore > 0 ? { marginTop: gapBefore } : undefined
}

/** 단 하나 — 상단 여백 + 배치된 아이템 스택 */
export function SheetColumn({ items, renderItem }: SheetColumnProps) {
  if (items.length === 0) {
    return <div className="h-full min-h-0" />
  }

  const last = items[items.length - 1]
  const stretchLast = last?.type === 'passage' && last.openBottom

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      /* 아래 여백은 packSheet 의 colHeight 에서도 빠진다 — 한쪽만 두면 마지막 문제가 잘린다 */
      style={{ paddingTop: COLUMN_TOP, paddingBottom: COLUMN_BOTTOM }}
    >
      {items.map((item, i) => {
        const gapBefore = item.gapBefore
        const grow = stretchLast && i === items.length - 1
        return (
          <div
            key={i}
            className={grow ? 'flex min-h-0 flex-1 flex-col' : undefined}
            style={itemSpacing(item, gapBefore)}
          >
            {renderItem(item)}
          </div>
        )
      })}
    </div>
  )
}
