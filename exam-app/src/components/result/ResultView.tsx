import { useCallback, useEffect, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import type { ExamScore } from '../../grade'
import type { ExamData, Examinee } from '../../types/exam'
import { BOOK_URL } from './constants'
import { buildReportFontCSS } from './fontEmbed'
import { ReportCard } from './ReportCard'
import { ScoreTablePopup } from './ScoreTablePopup'
import { WrongNotePopup } from './WrongNotePopup'

interface ResultViewProps {
  exam: ExamData
  examinee: Examinee
  score: ExamScore
}

/** 두 팝업은 겹쳐 띄우지 않고 갈아끼운다 (RESULT-PAGE.md §3) */
type Popup = null | { kind: 'scoreTable' } | { kind: 'wrongNote'; questionId?: number }

/** 성적표 아래 텍스트 링크 — 세로로 쌓고 가운데 정렬 */
function ActionLink({
  onClick,
  disabled,
  children,
}: {
  onClick?: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="border-0 bg-transparent py-1.5 font-serif text-[13px] text-ink underline-offset-4 hover:underline disabled:cursor-default disabled:text-ink-muted/50 disabled:no-underline"
    >
      {children}
    </button>
  )
}

/**
 * 결과 화면 (RESULT-PAGE.md §1).
 *
 * 성적표 카드 하나가 본문을 독점하고, 채점표·오답노트는 전부 팝업으로 뺀다.
 * 앞의 셋은 텍스트 링크, 마지막 책만 버튼이다. 순서를 바꾸지 않는다 —
 * 확인 → 복습 → 저장 → 구매.
 */
export function ResultView({ exam, examinee, score }: ResultViewProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [popup, setPopup] = useState<Popup>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)

  const wrongCount = score.wrong.length
  const perfect = wrongCount === 0

  // 화면에 들어오자마자 캡처용 폰트를 준비해 둔다 (fontEmbed.ts 참고)
  const fontCssRef = useRef<Promise<string> | null>(null)
  useEffect(() => {
    fontCssRef.current ??= buildReportFontCSS()
  }, [])

  const saveImage = useCallback(async () => {
    const node = cardRef.current
    if (!node || saving) return
    setSaving(true)
    setSaveError(false)
    try {
      const fontEmbedCSS = (await fontCssRef.current) || undefined
      const url = await toPng(node, { pixelRatio: 2, backgroundColor: '#ffffff', fontEmbedCSS })
      const a = document.createElement('a')
      a.href = url
      a.download = `성적통지표_${examinee.name}_${examinee.id}.png`
      a.click()
    } catch {
      setSaveError(true)
    } finally {
      setSaving(false)
    }
  }, [examinee, saving])

  return (
    <div className="h-full overflow-y-auto bg-white text-ink">
      <div className="mx-auto w-full max-w-[420px] px-5 py-10">
        <ReportCard
          meta={exam.meta}
          examinee={examinee}
          score={score}
          captureRef={cardRef}
        />

        {/* 성적표 폭 안에 세로로 쌓는다 — 성적표 하단 안내문처럼 읽힌다 */}
        <div className="mt-7 flex flex-col items-center">
          <ActionLink onClick={() => setPopup({ kind: 'scoreTable' })}>
            문항별 채점표 확인하기 ›
          </ActionLink>

          {/* 만점이어도 숨기지 않는다 — 사라지면 레이아웃이 흔들린다 (§5) */}
          <ActionLink
            disabled={perfect}
            onClick={perfect ? undefined : () => setPopup({ kind: 'wrongNote' })}
          >
            {perfect ? '틀린 문항이 없습니다' : `오답노트 확인하기 (${wrongCount}문항) ›`}
          </ActionLink>

          <ActionLink onClick={saveImage} disabled={saving}>
            {saving ? '이미지를 만드는 중…' : '성적표 이미지로 저장 ›'}
          </ActionLink>

          {saveError ? (
            <p className="m-0 mt-1 font-serif text-[11.5px] text-wrong" role="alert">
              이미지를 만들지 못했습니다. 화면을 캡처해 주세요.
            </p>
          ) : null}

          <a
            href={BOOK_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-block border border-accent bg-accent px-6 py-3 font-serif text-[14px] font-semibold text-white no-underline hover:opacity-90"
          >
            📖 책에서 확인하기
          </a>
        </div>
      </div>

      {popup?.kind === 'scoreTable' ? (
        <ScoreTablePopup
          results={score.results}
          onClose={() => setPopup(null)}
          onOpenWrongNote={(questionId) => setPopup({ kind: 'wrongNote', questionId })}
        />
      ) : null}

      {popup?.kind === 'wrongNote' ? (
        <WrongNotePopup
          exam={exam}
          wrong={score.wrong}
          startQuestionId={popup.questionId}
          onClose={() => setPopup(null)}
        />
      ) : null}
    </div>
  )
}
