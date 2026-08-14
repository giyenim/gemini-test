import { PageTurnButton } from './PageTurnButton'

/**
 * UI 킷 작업장 — 주소에 `?ui` 를 붙이면 앱 대신 이 화면이 열린다 (`main.tsx`).
 * `bg-white` 는 `index.css` 의 `body` 가 깔아 둔 모눈을 덮는다.
 */
export function Workbench() {
  return (
    <div className="h-full overflow-y-auto bg-white p-8">
      <div className="flex flex-wrap items-start gap-6">
        <PageTurnButton>이전 페이지</PageTurnButton>
        <PageTurnButton>다음 페이지</PageTurnButton>
        <PageTurnButton disabled>첫 페이지</PageTurnButton>
        <PageTurnButton disabled>마지막 페이지</PageTurnButton>
        <PageTurnButton>이름을 쓰세요</PageTurnButton>
      </div>
    </div>
  )
}
