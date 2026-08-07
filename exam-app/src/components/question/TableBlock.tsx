/**
 * 자료 표 — 수능형 문제지의 표 (가는 테두리 · 가운데 정렬)
 *
 * 레퍼런스 문제지에서 굵은 서체(견명조)를 쓰는 곳은 문항 번호와 페이지 번호뿐이다.
 * 표 머리와 첫 열도 보통 굵기다.
 */
interface TableBlockProps {
  head?: string[]
  rows: string[][]
}

export function TableBlock({ head, rows }: TableBlockProps) {
  return (
    <table className="w-full border-collapse border border-line text-center text-[11px] leading-[1.4]">
      {head && head.length > 0 ? (
        <thead>
          <tr>
            {head.map((cell, i) => (
              <th key={i} className="border border-line px-1 py-1 font-normal">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
      ) : null}
      <tbody>
        {rows.map((row, r) => (
          <tr key={r}>
            {row.map((cell, i) => (
              <td key={i} className="border border-line px-1 py-1 font-normal">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
