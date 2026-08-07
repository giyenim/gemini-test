import type { Examinee, ExamMeta } from '../types/exam'
import { SheetHeaderContinued } from './SheetHeaderContinued'
import { SheetHeaderFirst } from './SheetHeaderFirst'

/** 첫 장 vs 속지(2장~) 헤더 종류 */
export type SheetHeaderKind = 'first' | 'continued'

interface SheetHeaderProps {
  kind: SheetHeaderKind
  meta: ExamMeta
  pageNumber: number
  examinee?: Examinee | null
}

export function SheetHeader({ kind, meta, pageNumber, examinee }: SheetHeaderProps) {
  if (kind === 'first') {
    return <SheetHeaderFirst meta={meta} pageNumber={pageNumber} examinee={examinee} />
  }
  return <SheetHeaderContinued pageNumber={pageNumber} />
}

export { SheetHeaderFirst } from './SheetHeaderFirst'
export { SheetHeaderContinued } from './SheetHeaderContinued'
