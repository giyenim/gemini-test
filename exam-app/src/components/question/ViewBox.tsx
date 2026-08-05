/**
 * 보기 블록 — &lt;보 기&gt; 제목이 있는 박스
 */
interface ViewBoxProps {
  title: string
  body: string
}

export function ViewBox({ title, body }: ViewBoxProps) {
  return (
    <aside className="border-[1.25px] border-line bg-white" aria-label={title}>
      <div className="border-b border-line p-0.5 text-center text-[11.5px] font-bold tracking-[0.4em]">
        &lt;{title}&gt;
      </div>
      <div className="px-2 py-1.5 text-[11.5px] font-normal leading-[1.5]">
        {body.split('\n\n').map((para, i) => (
          <p key={i} className="mb-[0.5em] whitespace-pre-wrap last:mb-0">
            {para}
          </p>
        ))}
      </div>
    </aside>
  )
}
