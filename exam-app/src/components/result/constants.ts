/**
 * 책 소개 페이지 — 예스24 상품 페이지로 보낸다 (PC·모바일 공용, 링크는 여기 한 곳).
 * 《된다! 하루 만에 끝내는 제미나이 활용법》 개정판이다.
 */
export const BOOK_URL = 'https://www.yes24.com/product/goods/193852891'

/**
 * 테스트 공유 링크 — "테스트 공유하기"가 클립보드에 복사하는 주소.
 * `location.origin` 이 아니라 상수인 것은, 로컬 개발이나 GitHub Pages 예비 주소로
 * 열었을 때도 늘 공식 도메인이 복사되게 하기 위해서다.
 */
export const SHARE_URL = 'https://gemini-test.easyspub.co.kr'

/**
 * 채점 중 화면에서 띠 **안**에 차례로 흐르는 문구 (RESULT-PAGE.md §1).
 *
 * 채점기가 하는 일을 순서대로 읊는다 — 기다리는 시간이 빈 시간이 아니라 무언가
 * 진행되는 시간으로 읽힌다. 어투는 시험장의 그것을 따른다.
 *
 * **줄이 길면 잘린다.** 띠 안쪽은 가장 좁은 화면(320px)에서 224px 뿐이고
 * `whitespace-nowrap` 이라 넘치면 줄이 갈리는 대신 잘려 나간다. 지금 글자 크기의
 * 경계값은 `ui/ProgressBar` 주석에 계산식과 함께 적어 두었다 — 줄을 길게 고치면
 * 거기 값도 다시 재야 한다.
 *
 * `strong` 은 굵기(500), `accent` 는 표지의 보라. 강조는 **줄마다 여기서 지정한다** —
 * 순번으로 박아 두면 줄을 더하거나 순서를 바꿀 때 엉뚱한 줄이 강조된다.
 */
export const GRADING_MESSAGES: {
  text: string
  strong?: boolean
  accent?: boolean
}[] = [
  { text: '제미나이 모의고사는' },
  { text: '이지스 마케터스가' },
  { text: '《된다! 하루 만에 끝내는 제미나이 활용법》', strong: true },
  { text: '독자님을 위해 꼬물꼬물 만든 웹사이트입니다.' },
  { text: '많이 풀어주시면 뿌듯합니다.' },
  { text: '(⸝⸝. .⸝⸝)♡', strong: true, accent: true },
]

/** 문구 하나가 머무는 시간. 가장 긴 줄(24자)까지 읽고 넘어갈 만한 값이다 */
export const MESSAGE_MS = 1200

/**
 * 제출 후 성적표까지 끄는 시간 (RESULT-PAGE.md §1).
 *
 * **문구가 다 지나가는 시간이 곧 이 값이다.** 따로 적으면 마지막 문구가 채 읽히기 전에
 * 화면이 넘어가거나, 다 읊고 나서 빈 시간이 남는다. 문구를 더하거나 빼면 대기 시간도
 * 저절로 따라온다 — App 의 타이머와 띠도 이 값 하나를 본다.
 */
export const GRADING_MS = GRADING_MESSAGES.length * MESSAGE_MS
