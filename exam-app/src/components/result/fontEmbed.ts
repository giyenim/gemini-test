/**
 * 성적표를 PNG 로 구울 때 넣을 @font-face 만 따로 만든다.
 *
 * `html-to-image` 는 기본적으로 문서의 **모든** @font-face 를 훑어 파일을 내려받고
 * base64 로 박는다. 그러면 시험지용 조선신명조까지 함께 굽느라 저장이 한참 걸린다.
 *
 * 성적표 카드는 본문도 기입란도 전부 **조선굴림 하나**로 그린다. 이 한 벌만 넣으면 된다.
 * 실패하면 빈 문자열을 돌려주고, 호출부가 `html-to-image` 의 기본 동작으로 넘긴다.
 *
 * 카드 안에 다른 글꼴을 쓰기 시작하면 여기에도 함께 더해야 한다.
 */

/** `--font-gothic` / `--font-write` — index.css 의 @font-face 와 같은 파일이어야 한다 */
const CHOSUN_GU_WOFF2 = 'https://cdn.jsdelivr.net/gh/fonts-archive/ChosunGu/ChosunGu.woff2'

async function toDataUrl(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  const bytes = new Uint8Array(await res.arrayBuffer())
  // 한 번에 spread 하면 큰 파일에서 콜스택이 넘친다
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return `data:font/woff2;base64,${btoa(binary)}`
}

export async function buildReportFontCSS(): Promise<string> {
  try {
    const data = await toDataUrl(CHOSUN_GU_WOFF2)
    return `@font-face{font-family:'ChosunGu';font-style:normal;font-weight:400;src:url(${data}) format('woff2');}`
  } catch {
    return ''
  }
}
