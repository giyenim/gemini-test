import { useState } from 'react'
import { PageTurnButton } from './PageTurnButton'
import { SignatureModal, type SignatureTool } from './SignatureModal'

/**
 * UI 킷 작업장 — 주소에 `?ui` 를 붙이면 앱 대신 이 화면이 열린다 (`main.tsx`).
 * `bg-white` 는 `index.css` 의 `body` 가 깔아 둔 모눈을 덮는다.
 */
export function Workbench() {
  const [tool, setTool] = useState<SignatureTool>('pen')

  return (
    <div className="h-full overflow-auto bg-white p-8">
      <div className="flex flex-wrap items-start gap-6">
        <PageTurnButton>이전 페이지</PageTurnButton>
        <PageTurnButton>다음 페이지</PageTurnButton>
        <PageTurnButton disabled>첫 페이지</PageTurnButton>
        <PageTurnButton disabled>마지막 페이지</PageTurnButton>
        <PageTurnButton dotClass="fill-yellow-300">이름을 쓰세요</PageTurnButton>
      </div>

      {/* 도화지 자리는 비워 둔다 — 여기서 보는 것은 종이의 생김새다 */}
      <div className="mt-10">
        <SignatureModal
          tool={tool}
          onToolChange={setTool}
          onClose={() => {}}
          onConfirm={() => {}}
        >
          {null}
        </SignatureModal>
      </div>
    </div>
  )
}
