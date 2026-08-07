/**
 * 보기 블록 — &lt;보 기&gt; 라벨이 **윗선 위에 걸치는** 상자.
 *
 * 레퍼런스 문제지(`레퍼런스/01 물리학Ⅰ_문제.pdf` 2쪽 좌단) 실측:
 *   상자      x 99.0 ~ 405.5 · 윗선 y 598.9 · 아랫선 y 685.7
 *   윗선      99.1~229.8 / 274.8~405.5  ← 가운데가 끊겨 있다
 *   라벨      x 229.6~275.0 · y 594.3~606.1  ← 끊긴 자리에 선을 가로질러 놓인다
 *   첫 항목   y 612.9 (윗선에서 14.0 아래)
 *
 * 별도 머리줄(아래 테두리가 있는 행)이 아니다.
 */
import { BodyLines } from './BodyLines'

interface ViewBoxProps {
  title: string
  body: string
}

export function ViewBox({ title, body }: ViewBoxProps) {
  return (
    // 라벨이 윗선 위로 반쯤 올라오므로 그만큼 위 여백을 둔다
    <aside
      className="relative mt-[6px] border-[1.25px] border-line bg-white"
      aria-label={title}
    >
      {/* 라벨 — 흰 배경으로 윗선을 끊고 그 위에 얹는다 */}
      <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-[11.5px] leading-none font-normal [word-spacing:0.45em]">
        &lt;{title}&gt;
      </span>
      <div className="px-2 pt-[10px] pb-1.5 text-[11.5px] font-normal leading-[1.5]">
        <BodyLines body={body} />
      </div>
    </aside>
  )
}
