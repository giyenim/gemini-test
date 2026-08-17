import { useState, type ReactNode } from 'react'
import { PageTurnButton } from './PageTurnButton'
import { SignatureModal, type SignatureTool } from './SignatureModal'
import { SubmitButton, SubmitButtonFace } from './SubmitButton'

/** 견본 하나 — 어느 상태를 보고 있는지 밑에 적어 둔다 */
function Swatch({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2">
      {children}
      <span className="font-ui text-xs text-ink-muted">{label}</span>
    </div>
  )
}

/**
 * UI 킷 작업장 — 주소에 `?ui` 를 붙이면 앱 대신 이 화면이 열린다 (`main.tsx`).
 * `bg-white` 는 `index.css` 의 `body` 가 깔아 둔 모눈을 덮는다.
 */
export function Workbench() {
  const [tool, setTool] = useState<SignatureTool>('pen')
  /*
   * 확인 견본을 다시 재생시키는 열쇠. 도는 애니메이션은 한 바퀴만 돌고 멈추므로
   * 견본을 누를 때마다 이 값을 올려 통째로 다시 태운다 — 그래야 처음부터 다시 돈다.
   */
  const [replay, setReplay] = useState(0)

  return (
    <div className="h-full overflow-auto bg-white p-8">
      <div className="flex flex-wrap items-start gap-6">
        <PageTurnButton>이전 페이지</PageTurnButton>
        <PageTurnButton>다음 페이지</PageTurnButton>
        <PageTurnButton disabled>첫 페이지</PageTurnButton>
        <PageTurnButton disabled>마지막 페이지</PageTurnButton>
        <PageTurnButton dotClass="fill-yellow-300">이름을 쓰세요</PageTurnButton>
      </div>

      {/*
        제출 버튼 — 앞 둘은 `SubmitButtonFace` 라 눌러도 단계가 바뀌지 않는다.
        확인 단계 모양을 붙잡아 두고 그리라고 세워 둔 견본이다.
        맨 끝 하나만 진짜로, 두 번 눌러 넘어가는 흐름을 확인한다.
      */}
      <div className="mt-10 flex flex-wrap items-start gap-6">
        <Swatch label="기본">
          <SubmitButtonFace />
        </Swatch>
        <Swatch label="확인을 묻는 중 (눌러서 다시 재생)">
          <SubmitButtonFace key={replay} asking onClick={() => setReplay((n) => n + 1)} />
        </Swatch>
        <Swatch label="실제 동작 (두 번 눌러 보기)">
          <SubmitButton onSubmit={() => {}} />
        </Swatch>
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
