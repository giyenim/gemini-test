import { useState, type ReactNode } from 'react'
import { PageTurnButton } from './PageTurnButton'
import { ProgressBar, PROGRESS_BAR_W } from './ProgressBar'
import { PaperWindow } from './PaperWindow'
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
        {/*
          제출 버튼은 폭을 담긴 자리에서 받는다 (`w-full`). 여기서는 기댈 자리가 없으므로
          시험지 한 단(318 = `columnWidth(PAGE_W)`)을 흉내 낸 상자에 넣어 세운다.
        */}
        <Swatch label="기본">
          <div className="w-[318px]">
            <SubmitButtonFace />
          </div>
        </Swatch>
        <Swatch label="확인을 묻는 중">
          <div className="w-[318px]">
            <SubmitButtonFace asking />
          </div>
        </Swatch>
        <Swatch label="실제 동작 (두 번 눌러 보기)">
          <div className="w-[318px]">
            <SubmitButton onSubmit={() => {}} />
          </div>
        </Swatch>
      </div>

      {/*
        채워지는 띠 — 앞 셋은 값을 못 박아 세워 둔 견본이다. 저 혼자 시간을 재면
        중간 모양을 붙잡고 그릴 수가 없어 `value` 를 밖에서 준다.
        폭은 제출 버튼과 같이 시험지 한 단(318)을 흉내 낸 상자에서 받는다.
      */}
      <div className="mt-10 flex flex-wrap items-start gap-6">
        {[
          { label: '빈 띠', value: 0 },
          { label: '절반', value: 0.5 },
          { label: '가득', value: 1 },
        ].map(({ label, value }) => (
          <Swatch key={label} label={label}>
            <div className="max-w-full" style={{ width: PROGRESS_BAR_W }}>
              <ProgressBar value={value} label={label} />
            </div>
          </Swatch>
        ))}
      </div>

      <div className="mt-10 max-w-[560px]">
        <PaperWindow title="손그림 창 (PaperWindow)" onClose={() => {}}>
          <p className="m-0 text-[13px] text-ink-muted">
            서명 창과 같은 윤곽을 내용 크기에 맞춰 늘여 쓴다. 채점표가 이 창을 쓴다.
          </p>
        </PaperWindow>
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
