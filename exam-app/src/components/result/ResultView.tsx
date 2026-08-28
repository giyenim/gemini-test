import { useRef, useState } from 'react'
import type { ExamScore } from '../../grade'
import type { ExamData, Examinee } from '../../types/exam'
import { PageTurnButton } from '../../ui'
import { BOOK_URL, SHARE_URL } from './constants'
import { ReportCard } from './ReportCard'
import { ScoreTablePopup } from './ScoreTablePopup'
import { WrongNotePopup } from './WrongNotePopup'

interface ResultViewProps {
  exam: ExamData
  examinee: Examinee
  score: ExamScore
}

/** 두 팝업은 겹쳐 띄우지 않고 갈아끼운다 (RESULT-PAGE.md §3) */
type Popup = null | { kind: 'scoreTable' } | { kind: 'wrongNote' }

/** 성적표 아래 링크 셋이 같이 쓰는 생김새 — 버튼도 바깥 링크도 이것 하나다 */
const LINK =
  'border-0 bg-transparent py-1.5 text-ink no-underline underline-offset-4 hover:underline disabled:text-ink-muted/50 disabled:no-underline'

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
    <button type="button" onClick={onClick} disabled={disabled} className={LINK}>
      {children}
    </button>
  )
}

/**
 * 결과 화면 (RESULT-PAGE.md §1).
 *
 * 성적표 카드 하나가 본문을 독점하고, 채점표·오답노트는 전부 팝업으로 뺀다.
 * 아래 링크 셋은 생김새가 같다. 순서를 바꾸지 않는다 — 확인 → 복습 → 구매.
 */
export function ResultView({ exam, examinee, score }: ResultViewProps) {
  const [popup, setPopup] = useState<Popup>(null)

  const wrongCount = score.wrong.length
  const perfect = wrongCount === 0

  // 공유 버튼 — 누르면 시험 링크가 클립보드로 가고, 문구가 잠시 바뀌어 알려 준다
  const [copied, setCopied] = useState(false)
  const copiedTimer = useRef<number | undefined>(undefined)
  const share = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_URL)
    } catch {
      // 클립보드 API 가 막힌 환경(http 등) — 옛 방식으로 한 번 더
      const ta = document.createElement('textarea')
      ta.value = SHARE_URL
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    window.clearTimeout(copiedTimer.current)
    copiedTimer.current = window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    /* PC 는 시험지와 같은 842×1191 종이 위, 모바일은 그냥 흰 바탕 */
    <div className="h-full overflow-auto md:flex md:justify-center md:p-6 md:[scrollbar-gutter:stable]">
      <div className="min-h-full w-full bg-white text-ink md:m-auto md:flex md:h-[1191px] md:w-[842px] md:min-h-0 md:shrink-0 md:flex-col md:justify-center">
        <div className="w-full px-5 py-10">
          <ReportCard
            meta={exam.meta}
            examinee={examinee}
            score={score}
            actions={
              <>
                <ActionLink onClick={() => setPopup({ kind: 'scoreTable' })}>
                  문항별 채점표 ↗
                </ActionLink>

                {/* 만점이어도 숨기지 않고 흐리게 죽인다 — 사라지면 줄이 흔들린다 (§5) */}
                <ActionLink
                  disabled={perfect}
                  onClick={perfect ? undefined : () => setPopup({ kind: 'wrongNote' })}
                >
                  오답노트 ↗
                </ActionLink>
              </>
            }
          />

          {/* 책 링크·공유만 카드 밖에 남는다 — 시험지 밖으로 나가는 길이라서,
              쪽 넘김과 같은 손그림 버튼으로 도드라지게 둔다 */}
          {/* 모바일은 세로로 쌓고, PC(md~)는 한 줄로 나란히 */}
          <div className="mt-7 flex flex-col items-center gap-3 md:flex-row md:justify-center md:gap-6">
            <PageTurnButton href={BOOK_URL}>책에서 확인하기</PageTurnButton>
            <PageTurnButton onClick={share}>
              {copied ? '링크 복사 완료!' : '테스트 공유하기'}
            </PageTurnButton>
          </div>
        </div>

      </div>

      {popup?.kind === 'scoreTable' ? (
        <ScoreTablePopup results={score.results} onClose={() => setPopup(null)} />
      ) : null}

      {popup?.kind === 'wrongNote' ? (
        <WrongNotePopup
          exam={exam}
          wrong={score.wrong}
          onClose={() => setPopup(null)}
        />
      ) : null}
    </div>
  )
}
