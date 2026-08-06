/**
 * 일반 블록 — 제목 없이 테두리만 있는 본문
 * (예: 학생 대화, 자료, 순서 설명 등)
 */
import { BodyLines } from './BodyLines'

interface GeneralBlockProps {
  body: string
}

export function GeneralBlock({ body }: GeneralBlockProps) {
  return (
    <aside className="border-[1.25px] border-line bg-white">
      <div className="px-2.5 py-2 text-[12px] font-normal leading-[1.5]">
        <BodyLines body={body} />
      </div>
    </aside>
  )
}
