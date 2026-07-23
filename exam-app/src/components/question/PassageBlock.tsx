/**
 * 지문 (Passage) — 단/페이지 분할 조각 지원
 */
import type { ReactNode } from 'react'
import type { PassageSegment } from '../../layout/types'

export type PassageBoxMode = 'full' | 'open-bottom' | 'open-top' | 'open-both'

interface PassageBlockProps {
  label: string
  intro: string
  segments: PassageSegment[]
  showIntro?: boolean
  boxMode?: PassageBoxMode
  /** 단 하단까지 박스 세로선 연장 (open-bottom 조각) */
  fillColumn?: boolean
  renderBody?: (para: string) => ReactNode
}

function boxClass(mode: PassageBoxMode): string {
  // 이어지는 단: 열린 쪽 패딩 제거 (아래/위 빈 여백 없음)
  switch (mode) {
    case 'open-bottom':
      return 'border-t-[1.25px] border-x-[1.25px] border-line px-2.5 pt-2 pb-0'
    case 'open-top':
      return 'border-b-[1.25px] border-x-[1.25px] border-line px-2.5 pt-0 pb-2'
    case 'open-both':
      return 'border-x-[1.25px] border-line px-2.5 py-0'
    default:
      return 'border-[1.25px] border-line px-2.5 py-2'
  }
}

export function PassageBlock({
  label,
  intro,
  segments,
  showIntro = true,
  boxMode = 'full',
  fillColumn = false,
  renderBody,
}: PassageBlockProps) {
  const stretch =
    fillColumn && (boxMode === 'open-bottom' || boxMode === 'open-both')

  return (
    <section className={stretch ? 'flex h-full min-h-0 flex-col' : undefined}>
      {showIntro ? (
        <p className="mb-1.5 shrink-0 text-[11.5px] font-normal">
          <strong className="font-bold">{label}</strong> {intro}
        </p>
      ) : null}
      {segments.length > 0 ? (
        <div
          className={`${boxClass(boxMode)}${stretch ? ' min-h-0 flex-1' : ''}`}
        >
          <div className="text-justify text-[11.5px] leading-normal">
            {segments.map((seg, i) => (
              <p
                key={i}
                className={`mb-[0.5em] last:mb-0 ${seg.indent ? 'indent-[1em]' : ''}`}
              >
                {renderBody ? renderBody(seg.text) : seg.text}
              </p>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
