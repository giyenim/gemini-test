import type { QuestionResult } from '../../grade'
import { PaperWindow } from '../../ui'
import { choiceMark } from '../question/choiceMarks'
import { Modal } from './Modal'

interface ScoreTablePopupProps {
  results: QuestionResult[]
  onClose: () => void
}

/** 고르지 않은 답은 `—` — 찍어서 틀린 것과 못 푼 것을 구분한다 */
function answerMark(choice: QuestionResult['selected']) {
  return choice === null ? '—' : choiceMark(choice)
}

/**
 * 문항별 채점표 (RESULT-PAGE.md §3).
 *
 * 축소·확대를 두지 않고 **늘 펼친 모습 하나**다. 접어 두면 결국 다시 펴게 되고,
 * 두 모습을 맞춰 두느라 칸 크기가 양쪽에 묶인다.
 *
 * 칸은 읽는 것이지 누르는 것이 아니다 — 오답노트로 가는 길은 성적표의 링크 하나뿐이다.
 *
 * 창은 UI 킷의 손그림 종이(`PaperWindow`)를 쓴다 — 서명 창과 같은 윤곽이다.
 * `Modal` 은 껍데기 없이(`bare`) 어둡게 깔기·Esc·바깥 누르기만 맡는다.
 */
export function ScoreTablePopup({ results, onClose }: ScoreTablePopupProps) {
  return (
    <Modal title="문항별 채점표" width={960} bare hideHeader bodyClassName="contents" onClose={onClose}>
      <PaperWindow title="문항별 채점표" onClose={onClose}>
        {/* 문항 수가 20이 아니어도 4열 고정, 행만 늘어난다. 모바일은 2열 */}
        <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-4">
          {results.map((r) => {
            const body = (
              <>
                <span className="flex items-center justify-between gap-1">
                  <span className="font-semibold">{r.id}</span>
                  <span className={`leading-none ${r.correct ? 'text-correct' : 'text-wrong'}`}>
                    {r.correct ? '○' : '✕'}
                  </span>
                </span>
                {/* 한 줄에 다 넣는다 — 줄이 갈리면 칸 높이가 문항마다 달라진다 */}
                <div className="mt-1 flex text-sm justify-between whitespace-nowrap text-ink-muted">
                <span>
                  내 답 {answerMark(r.selected)} · 정답 {choiceMark(r.answer)}
                </span>
                <span>
                  {r.points}점
                </span>
                </div>
              </>
            )

            return (
              <li
                key={r.id}
                /* 오답은 테두리 색으로만 가른다 — 바탕까지 물들이면 표가 얼룩덜룩해진다 */
                className={`block w-full border bg-white px-2 py-1.5 text-left ${
                  r.correct ? 'border-line' : 'border-wrong'
                }`}
              >
                {body}
              </li>
            )
          })}
        </ul>
      </PaperWindow>
    </Modal>
  )
}
