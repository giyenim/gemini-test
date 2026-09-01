import type { ReactNode } from 'react'
import type { ExamScore } from '../../grade'
import type { Examinee, ExamMeta } from '../../types/exam'
import { SignatureMark } from '../SignaturePad'

/** 카드 폭 — 여기 한 곳에서만 정한다 */
const CARD_W = 'w-[800px] max-w-full'

/** 글자 — 카드 안 모든 글자가 이 글꼴·크기·굵기 하나를 쓴다. 개별 덮어쓰기 없음 */
const CARD_TEXT = 'font-gothic font-normal'

export function ReportCard({
  meta,
  examinee,
  score,
  actions,
}: {
  meta: ExamMeta
  examinee: Examinee
  score: ExamScore
  /** 카드 안에 들어가는 링크 — 글꼴·크기는 카드 것을 그대로 물려받는다 */
  actions?: ReactNode
}) {
  return (
    <div
      /* 좁은 화면에서는 좌우 여백을 줄인다 — px-8 이면 320px 에서 글자 자리가 216px 밖에 안 남는다 */
      className={`${CARD_W} ${CARD_TEXT} mx-auto border-[3px] border-line bg-white px-5 py-8 text-ink md:px-8`}
    >
      {/*
        제목은 PC 에서 한 줄이다. 좁은 화면에서는 줄을 풀어 두 줄로 앉힌다 —
        `keep-all` 이라 낱말 가운데가 아니라 띄어쓰기에서만 갈린다.
      */}
      <header className="mb-7 flex items-baseline justify-center text-center text-lg font-semibold [word-break:keep-all] md:whitespace-nowrap md:text-2xl">
        <span>
          {meta.year} {meta.title} 성적통지표
        </span>
      </header>

      {/*
        성명이 왼쪽, 수험번호가 오른쪽 — 실물 통지표와 같은 차례다.
        폭이 어떻든 **한 줄에 양 끝으로** 벌린다. 화면 크기로 가르지 않고 `flex-wrap` 에
        맡겨, 둘이 서로 닿을 때에만 저절로 두 줄이 된다 — 넉넉한 모바일에서까지
        미리 쌓아 두면 빈 자리를 버리는 셈이다.
        `gap-x` 는 붙기 직전의 최소 사이, `gap-y` 는 줄이 갈렸을 때의 사이다.
      */}
      <div className="mb-7 flex flex-wrap justify-between gap-x-4 gap-y-1 font-semibold">
        <p className="m-0 flex text-md">
          성명
          <SignatureMark src={examinee.signature} className="ml-1 h-[22px] w-auto object-contain" />
        </p>
        <p className="m-0">
          수험번호 <span className="ml-1 font-normal">{examinee.id}</span>
        </p>
      </div>

      {/*
        `table-fixed` + colgroup — 점수 네 칸은 글자 수(원점수·표준점수·백분위·등급)에
        맡기면 제각각 넓어진다. 폭을 못박아 넷을 똑같이 두고, 남는 자리는 영역 칸이 갖는다.
      */}
      <table className="w-full mb-7 table-fixed border-collapse text-center [&_th]:border [&_th]:border-line [&_th]:py-3 [&_td]:border [&_td]:border-line [&_td]:py-3">
        <colgroup>
          <col />
          <col className="w-[17%]" />
          <col className="w-[17%]" />
          <col className="w-[17%]" />
          <col className="w-[17%]" />
        </colgroup>
        <thead>
          <tr>
            <th>영역</th>
            <th>원점수</th>
            <th>표준점수</th>
            <th>백분위</th>
            <th>등급</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="leading-tight">{meta.subject.replace(/\s+/g, ' ')}</td>
            <td>
              {score.earned}
              <span className="text-ink-muted">/{score.max}</span>
            </td>
            <td>{score.standard}</td>
            <td>{score.percentile}</td>
            <td>{score.grade}</td>
          </tr>
        </tbody>
      </table>

      {/* 좁은 화면에서는 두 링크를 한 줄씩 가운데로 — 나란히 두면 글자가 세로로 눌린다 */}
      {actions ? (
        <div className="mb-7 flex flex-col items-center gap-1 md:flex-row md:justify-center md:gap-50">
          {actions}
        </div>
      ) : null}

      <footer className="text-center">
        <p className="mb-5 text-sm font-semibold md:text-xl">{examinee.takenAt}</p>
        {/*
          관인처럼 글자 사이를 한 칸씩 벌린다. 그만큼 가로로 길어져서 좁은 화면에서는
          많이 줄여야 한 줄에 앉는다 — 두 줄로 갈리면 관인으로 안 보인다.
        */}
        <p className="text-base font-semibold md:text-3xl">{[...meta.publisher].join(' ')}</p>
      </footer>
    </div>
  )
}
