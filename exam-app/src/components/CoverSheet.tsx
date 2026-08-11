import {
  PAGE_H,
  PAGE_PAD_BOTTOM,
  PAGE_PAD_TOP,
  PAGE_PAD_X,
  PAGE_W,
} from '../layout/constants'
import type { Examinee, ExamMeta } from '../types/exam'
import { SignatureField, SignatureMark } from './SignaturePad'

/**
 * 시험지 표지 — 문제 페이지 앞에 한 장 붙는다.
 *
 * 페이지 규격·여백·글꼴을 `layout/constants.ts`, `index.css` 와 맞춰 두었으므로
 * 값이 갈라지지 않게 함께 고친다.
 *
 * 쪽 번호를 붙이지 않고 `data-page` 도 달지 않는다 — 문제 페이지가 1쪽부터 시작해야 하고,
 * 쪽수 검사(`document.querySelectorAll('[data-page]').length === 4`)도 표지를 세면 안 된다.
 *
 * 세로 배치는 위에서부터 흘려 내리고 블록 사이 간격만 GAP 으로 조절한다.
 * 칸을 절대 위치로 박지 않아 문구 길이가 바뀌어도 깨지지 않는다.
 */

/** 블록 사이 세로 간격 — 표지 배치는 여기만 만지면 된다 */
const GAP = {
  periodToTitle: 26,
  titleToSubject: 46,
  subjectToFields: 58,
  fieldsToNotice: 78,
  noticeToBanner: 62,
  bannerToBrand: 84,
}

/**
 * 유의 사항 — 필적 확인 문구는 두 번째 항목 안에 회색 띠로 끼워 넣는다.
 *
 * 이 시험지에는 종이 답안지가 없고 수험 번호도 앱이 발급한다(`examinee.ts`).
 * 그래서 원본 수능 표지의 문구를 그대로 두면 없는 물건을 가리키게 된다 —
 * **띠와 ○ 목록의 꼴은 그대로 두고 문구만 이 시험지의 사정에 맞췄다.** 필적 확인
 * 띠는 쓸모가 있어서가 아니라 표지가 표지처럼 보이게 하려고 남겨 둔 것이고,
 * 항목 자체가 그렇다고 밝힌다. 답안지 표기 안내가 있던 자리는 책 소개로 쓰되,
 * 시험을 치는 데 필요한 배점 안내를 앞에 두고 **맨 끝**에 붙인다.
 */
const HANDWRITING = '사람을 구체적으로 도와주는 책'
const BANNER = '※ 시험이 시작되건 말건 표지를 넘기시오.'

const NOTICES = [
  '문제지의 해당란에 성명을 정확히 쓰시오. 수험 번호는 자동으로 부여됩니다.',
  '필적 확인 문구는 형식을 맞추려고 넣었습니다. 다음의 문구를 마음에 새기시오.',
  '문항에 따라 배점이 다릅니다. 3점 문항에만 점수가 표시되어 있습니다. 점수 표시가 없는 문항은 모두 2점입니다.',
  '본 시험지는 《된다! 하루 만에 끝내는 제미나이 활용법》 개정판을 바탕으로 만들어졌습니다. 책에 관심을 주시오.',
]
/** 필적 확인 띠가 들어갈 항목 (0부터) */
const HANDWRITING_AFTER = 1

/**
 * 성명 칸 폭. 서명 창의 도화지는 이 칸과 비율이 **달라도 된다** — 넘어올 때 획이
 * 놓인 자리만 잘려 오고(`SignaturePad` 의 `trimToInk`) 여기서는 `object-contain`
 * 으로 비율을 지킨 채 놓이므로, 어디에 얼마나 크게 쓰든 칸을 채운다.
 */
const NAME_W = 148

interface CoverSheetProps {
  meta: ExamMeta
  examinee?: Examinee | null
  /**
   * 주면 성명 칸이 **직접 쓰는 칸**이 된다. 여기 쓴 서명이 속지 헤더와 성적표까지
   * 그대로 따라간다 — 실제 시험지도 표지와 속지 양쪽에 성명란이 있다.
   */
  onSignatureChange?: (dataUrl: string | null) => void
}

function NoticeItem({ text, children }: { text: string; children?: React.ReactNode }) {
  return (
    <li className="text-[16px] leading-[1.7] tracking-[-0.03em]">
      <div className="flex">
        {/* ○ 글머리 — 목록 마커 대신 직접 그려 행잡기를 맞춘다 */}
        <span aria-hidden className="w-6 shrink-0 text-[13px] leading-[1.95]">
          ○
        </span>
        <span className="min-w-0 flex-1">{text}</span>
      </div>
      {children}
    </li>
  )
}

/** 성명 · 수험 번호 — 라벨도 테두리 안에 들어가고 세로 실선으로 나뉜다 */
function Field({
  label,
  labelWidth,
  children,
}: {
  label: string
  labelWidth: number
  children: React.ReactNode
}) {
  return (
    <div className="flex h-9 items-stretch border-[1.2px] border-line">
      <span
        className="flex items-center justify-center border-r-[1.2px] border-line whitespace-nowrap tracking-[-0.02em]"
        style={{ width: labelWidth }}
      >
        {label}
      </span>
      {children}
    </div>
  )
}

export function CoverSheet({ meta, examinee, onSignatureChange }: CoverSheetProps) {
  // 4칸 + 하이픈 + 4칸. 칸 수는 이 배열 길이로만 정한다
  const idCells = [
    ...(examinee?.id.slice(0, 4) ?? '    ').padEnd(4).split(''),
    '—',
    ...(examinee?.id.slice(4, 8) ?? '    ').padEnd(4).split(''),
  ]

  return (
    <div
      data-cover
      className="flex flex-col overflow-hidden bg-white font-serif text-ink"
      style={{
        width: PAGE_W,
        height: PAGE_H,
        padding: `${PAGE_PAD_TOP}px ${PAGE_PAD_X}px ${PAGE_PAD_BOTTOM}px`,
      }}
    >
      {/* 1. 교시 — 본문 헤더와 같은 모양이되 표지에서는 한 단계 크다 */}
      <div className="inline-flex h-11 origin-left scale-x-[0.86] items-center justify-center self-start whitespace-nowrap rounded-full border-[1.2px] border-line px-5 font-gothic text-[27px] font-bold leading-none tracking-[-0.02em]">
        {meta.period}
      </div>

      {/* 2. 시험명 */}
      <p
        className="m-0 scale-x-[0.94] text-center font-gothic text-[27px] font-semibold leading-[1.15] whitespace-nowrap tracking-[-0.02em]"
        style={{ marginTop: GAP.periodToTitle }}
      >
        {meta.year} {meta.title}
      </p>

      {/* 3. 과목명 — 표지에서 가장 큰 활자.
             letter-spacing 이 오른쪽에도 붙어 광학 중심이 밀리므로 그만큼 되민다 */}
      <h1
        className="m-0 text-center font-gothic text-[62px] font-bold leading-none whitespace-nowrap tracking-[0.1em] indent-[0.1em]"
        style={{ marginTop: GAP.titleToSubject }}
      >
        {meta.subject}
      </h1>

      {/* 4. 성명 · 수험 번호 */}
      <div
        className="flex items-stretch justify-center gap-[22px] font-gothic text-[18px] leading-none"
        style={{ marginTop: GAP.subjectToFields }}
      >
        <Field label="성명" labelWidth={58}>
          {onSignatureChange ? (
            <SignatureField
              value={examinee?.signature ?? null}
              onChange={onSignatureChange}
              width={NAME_W}
            />
          ) : (
            <span className="flex items-center justify-center px-1" style={{ width: NAME_W }}>
              <SignatureMark src={examinee?.signature} className="max-h-full w-full object-contain" />
            </span>
          )}
        </Field>
        <Field label="수험 번호" labelWidth={100}>
          <span className="flex">
            {idCells.map((ch, i) => (
              <span
                key={i}
                className={`flex w-7 items-center justify-center text-[18px] ${
                  i < idCells.length - 1 ? 'border-r border-dashed border-line' : ''
                } ${ch === '—' ? 'font-serif' : 'font-write'}`}
              >
                {ch.trim()}
              </span>
            ))}
          </span>
        </Field>
      </div>

      {/* 5. 유의 사항 */}
      <section
        className="border-[1.2px] border-line px-10 pt-[34px] pb-9"
        style={{ marginTop: GAP.fieldsToNotice }}
      >
        <ul className="m-0 flex list-none flex-col gap-[22px] p-0">
          {NOTICES.map((text, i) => (
            <NoticeItem key={i} text={text}>
              {i === HANDWRITING_AFTER ? (
                <div className="my-[16px] border-[1.2px] border-line bg-band py-[11px] text-center text-[19px] font-bold leading-none tracking-[-0.02em]">
                  {HANDWRITING}
                </div>
              ) : null}
            </NoticeItem>
          ))}
        </ul>
      </section>

      {/* 6. 배너 */}
      <div
        className="border-[1.2px] border-line bg-band py-[15px] text-center text-[22px] font-bold leading-none tracking-[-0.02em]"
        style={{ marginTop: GAP.noticeToBanner }}
      >
        {BANNER}
      </div>

      {/* 7. 발행처 — 표지의 마지막 블록 */}
      <div
        className="text-center font-gothic text-[30px] font-bold leading-none tracking-[0.06em] indent-[0.06em] whitespace-nowrap"
        style={{ marginTop: GAP.bannerToBrand }}
      >
        {meta.publisher}
      </div>
    </div>
  )
}
