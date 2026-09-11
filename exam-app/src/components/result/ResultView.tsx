import { useState } from 'react'
import { trackClick } from '../../analytics'
import type { ExamScore } from '../../grade'
import type { ExamData, Examinee } from '../../types/exam'
import { PageTurnButton } from '../../ui'
import { BOOK_URL } from './constants'
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
  'border-0 bg-transparent py-1.5 font-bold text-ink no-underline underline-offset-4 hover:underline disabled:text-ink-muted/50 disabled:no-underline'

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

  return (
    /*
      시험을 마친 화면이라 종이를 깔지 않는다 — 성적표 카드와 버튼이 책상(모눈·표지 벽지)
      위에 그대로 놓인다. 흰 바탕은 카드가 제 몫으로 가지고 있다 (`ReportCard`).
      시험지와 같은 842 폭만 지켜 성적표가 앞 화면들과 같은 자에 맞는다.
      세로 가운데는 `items-center` 가 아니라 `m-auto` 로 잡는다 — 내용이 화면보다
      길어지면 auto 여백이 0 이 되어 위쪽이 스크롤 밖으로 잘리지 않는다 (App.tsx 와 같은 이유).
    */
    <div className="h-full overflow-auto md:flex md:justify-center md:p-6 md:[scrollbar-gutter:stable]">
      <div className="min-h-full w-full text-ink md:m-auto md:h-auto md:w-[842px] md:min-h-0 md:shrink-0">
        <div className="w-full px-5 py-10">
          <ReportCard
            meta={exam.meta}
            examinee={examinee}
            score={score}
            actions={
              <>
                <ActionLink
                  onClick={() => {
                    trackClick('score_table')
                    setPopup({ kind: 'scoreTable' })
                  }}
                >
                  {'<문항별 채점표 보기>'}
                </ActionLink>

                {/* 만점이어도 숨기지 않고 흐리게 죽인다 — 사라지면 줄이 흔들린다 (§5) */}
                <ActionLink
                  disabled={perfect}
                  onClick={
                    perfect
                      ? undefined
                      : () => {
                          trackClick('wrong_note')
                          setPopup({ kind: 'wrongNote' })
                        }
                  }
                >
                  {'<오답노트 보기>'}
                </ActionLink>
              </>
            }
          />

          {/* 책 링크만 카드 밖에 남는다 — 시험지 밖으로 나가는 길이라서,
              쪽 넘김과 같은 손그림 버튼으로 도드라지게 둔다 */}
          <div className="mt-7 flex justify-center">
            {/*
              점 색은 제출 버튼(`ui/SubmitButton` 의 `DOT_COLORS`)의 첫 색이다. 버튼을 다시
              여럿 두게 되면 그 차례(빨강·남색·노랑)대로 적어 한 벌임이 드러나게 한다.
            */}
            <PageTurnButton
              href={BOOK_URL}
              dotClass="fill-rose-500"
              onClick={() => trackClick('book')}
            >
              책 보러가기
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
