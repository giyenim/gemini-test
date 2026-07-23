/**
 * 일반 블록 — 제목 없이 테두리만 있는 본문
 * (예: 선생님 설명, 자료, 표 설명 등)
 */
interface GeneralBlockProps {
  body: string
}

export function GeneralBlock({ body }: GeneralBlockProps) {
  return (
    <aside className="mb-1.5 border-[1.25px] border-line bg-white">
      <div className="px-2.5 py-2 text-[11px] font-normal leading-[1.45]">
        {body.split('\n\n').map((para, i) => (
          <p key={i} className="mb-[0.5em] whitespace-pre-wrap last:mb-0">
            {para}
          </p>
        ))}
      </div>
    </aside>
  )
}
