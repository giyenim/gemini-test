import type { ExamMeta } from '../types/exam'
import { SheetHeaderContinued } from './SheetHeaderContinued'
import { SheetHeaderFirst } from './SheetHeaderFirst'

/** 첫 장 vs 속지(2장~) 헤더 종류 */
export type SheetHeaderKind = 'first' | 'continued'

interface SheetHeaderProps {
  kind: SheetHeaderKind
  meta: ExamMeta
  pageNumber: number
}

export function SheetHeader({ kind, meta, pageNumber }: SheetHeaderProps) {
  if (kind === 'first') {
    return <SheetHeaderFirst meta={meta} pageNumber={pageNumber} />
  }
  return <SheetHeaderContinued meta={meta} pageNumber={pageNumber} />
}

export { SheetHeaderFirst } from './SheetHeaderFirst'
export { SheetHeaderContinued } from './SheetHeaderContinued'
