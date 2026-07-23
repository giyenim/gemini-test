import type { ReactNode } from 'react'
import type { PlacedItem } from '../layout/types'
import { COLUMN_TOP } from '../layout/constants'

interface SheetColumnProps {
  items: PlacedItem[]
  renderItem: (item: PlacedItem) => ReactNode
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
      style={{ paddingTop: COLUMN_TOP }}
    >
      {items.map((item, i) => {
        const gapBefore = item.gapBefore
        const grow = stretchLast && i === items.length - 1
        return (
          <div
            key={i}
            className={grow ? 'flex min-h-0 flex-1 flex-col' : undefined}
            style={gapBefore > 0 ? { marginTop: gapBefore } : undefined}
          >
            {renderItem(item)}
          </div>
        )
      })}
    </div>
  )
}
