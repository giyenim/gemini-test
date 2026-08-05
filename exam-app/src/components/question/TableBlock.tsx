/**
 * 자료 표 — 수능형 문제지의 표 (가는 테두리 · 가운데 정렬)
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
              <th
                key={i}
                className="border border-line px-1 py-1 font-bold break-keep"
              >
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
              <td
                key={i}
                className={`border border-line px-1 py-1 break-keep ${
                  i === 0 ? 'font-semibold' : ''
                }`}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
