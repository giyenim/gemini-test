import { useState } from 'react'
import { PaperWindow } from '../../ui'
import {
  BONUS_CHECK_LABEL,
  BONUS_LINES,
  BONUS_LINK_LABEL,
  BONUS_TITLE,
  BONUS_URL,
} from './constants'
import { Modal } from './Modal'

/**
 * 특별자료 창 — 한시적 이벤트 (`constants.ts` 의 특별자료 절).
 *
 * 안내를 읽히고, **`네! 완료했어요!` 를 누르면 그 자리가 링크로 바뀐다.** 공유했는지는
 * 확인할 방법이 없으므로 이것은 검사가 아니라 한 번 더 눈에 밟히게 하는 장치다 —
 * 스스로 누르는 동작이 공유를 떠올리게 한다.
 *
 * 네모 칸(`input[type=checkbox]`)은 두지 않는다. 브라우저가 그리는 네모는 손그림 종이
 * 위에서 혼자 각지고, 켜고 끄는 칸처럼 보여 **되돌릴 수 있다는 오해**를 준다. 실제로는
 * 한 번 누르면 끝이라 글자만 남긴다.
 *
 * 링크는 새 탭을 대신 열어 주지 않고 그 자리에 띄운다. 팝업 차단에 걸리면 아무 일도
 * 일어나지 않은 것처럼 보이기 때문이다 — 누르는 쪽이 사람이면 차단되지 않는다.
 *
 * 창은 채점표·오답노트와 같은 손그림 종이(`PaperWindow`)를 쓴다. 결과 화면의
 * 창들은 겹쳐 띄우지 않고 갈아끼운다 (RESULT-PAGE.md §3).
 */
export function BonusPopup({ onClose }: { onClose: () => void }) {
  const [done, setDone] = useState(false)

  return (
    <Modal title={BONUS_TITLE} width={560} bare hideHeader bodyClassName="contents" onClose={onClose}>
      <PaperWindow title={BONUS_TITLE} onClose={onClose}>
        {/*
          줄 간격은 **모든 줄이 같다.** 특정 줄만 좁히면(한때 이모티콘 줄이 그랬다) 문구를
          고칠 때 그 규칙이 엉뚱한 줄에 걸려 간격이 들쭉날쭉해진다 — 줄 수와 무관하게
          한 값으로 둔다.
        */}
        <div className="text-[15px] leading-relaxed">
          {BONUS_LINES.map((line) => (
            <p key={line} className="m-0 mb-1.5 last:mb-0">
              {line}
            </p>
          ))}
        </div>

        {/*
          누르기 전 문구와 링크가 **같은 자리를 나눠 쓴다.** 둘의 높이가 달라 갈아끼울 때
          창이 출렁이므로, 자리 높이를 고정하고(`min-h`) 안에서 가운데로 놓는다.
          안내와는 떼어 둔다 — 읽는 글과 누르는 것이 섞이면 눈에 걸리지 않는다.

          아래 여백을 `-mb-2` 로 당기는 것은, 종이(`PaperWindow`)가 아랫변이 굽은 탓에
          위(48px)보다 아래(56px)를 넓게 잡아 두었기 때문이다 — 그대로 두면 내용이
          가운데가 아니라 위로 붙어 보인다. 종이 쪽 값은 채점표·오답노트가 함께 쓰므로
          건드리지 않고, 이 창에서만 그 차이를 상쇄한다.
        */}
        <div className="mt-6 -mb-[11px] flex min-h-9 items-center justify-center">
          {done ? (
            /* `noopener` 는 새 탭이 이 창을 되짚지 못하게 막는 기본 조치다 */
            <a
              href={BONUS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-normal text-[15px] text-blue-700 underline underline-offset-4"
            >
              {BONUS_LINK_LABEL}
            </a>
          ) : (
            <button
              type="button"
              onClick={() => setDone(true)}
              className="border-0 bg-transparent p-0 font-ui text-[15px] font-semibold text-ink"
            >
              {BONUS_CHECK_LABEL}
            </button>
          )}
        </div>
      </PaperWindow>
    </Modal>
  )
}
