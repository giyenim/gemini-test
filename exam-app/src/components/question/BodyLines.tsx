/**
 * 자료·보기 박스의 본문 줄 렌더.
 *
 * `ㄱ.` `A:` `❶` 처럼 **머리표가 붙은 줄**은 행잉 인덴트로 그린다.
 * 줄이 넘칠 때 이어지는 줄이 머리표 아래로 파고들면 안 된다 (레퍼런스 문제지 실측):
 *
 *   ㄷ. 사람이 p에 작용하는 힘과 p가 사람에게 작용하는 힘은    ← 456.4
 *       작용 반작용 관계이다.                                ← 474.4 = 머리표 다음 글자
 *
 * 머리표 폭이 종류마다 다르므로(`ㄱ.` `A:` `❶`) 고정값 대신 flex로 자동으로 맞춘다.
 */

/** 머리표 — `ㄱ.` `ㄴ.` / `A:` `B:` / `❶` `❷` / `①` `②` */
const LABEL = /^([ㄱ-ㅎ]\s*[.)]|[A-Za-z]\s*[:.)]|[❶-❿]|[①-⑮])\s+/

interface BodyLinesProps {
  body: string
}

export function BodyLines({ body }: BodyLinesProps) {
  // 빈 줄로 나눈 문단 → 문단 안에서 줄바꿈 단위로 나눈 줄
  const paragraphs = body.split('\n\n')

  return (
    <>
      {paragraphs.map((para, p) => (
        <div key={p} className="mb-[0.5em] last:mb-0">
          {para.split('\n').map((line, i) => {
            const match = LABEL.exec(line)
            if (!match) {
              return (
                <p key={i} className="m-0">
                  {line}
                </p>
              )
            }
            return (
              <p key={i} className="m-0 flex">
                <span className="shrink-0 pr-[0.35em]">{match[1]}</span>
                <span className="min-w-0 flex-1">{line.slice(match[0].length)}</span>
              </p>
            )
          })}
        </div>
      ))}
    </>
  )
}
