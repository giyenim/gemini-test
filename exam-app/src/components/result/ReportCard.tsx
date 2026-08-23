import type { ReactNode } from 'react'
import type { ExamScore } from '../../grade'
import type { Examinee, ExamMeta } from '../../types/exam'
import { SignatureMark } from '../SignaturePad'

/** 카드 폭 — 여기 한 곳에서만 정한다 */
const CARD_W = 'w-[800px] max-w-full'

/** 글자 — 카드 안 모든 글자가 이 글꼴·크기·굵기 하나를 쓴다. 개별 덮어쓰기 없음 */
const CARD_TEXT = 'font-gothic font-normal'

/**
 * 표 아래 설명 — 실물 수능 성적통지표의 그 자리다.
 * `grade.ts` 가 실제로 하는 계산을 그대로 옮긴 문구다 (BASE_MEAN 30 / BASE_SD 9,
 * 표준점수 20z+100, 백분위 정규분포 누적확률, 등급 구간 GRADE_CUTS).
 * 등급 구간의 원점수와 예시 값은 그 식에 실제로 넣어 뽑은 것이다.
 * **계산을 고치면 이 문구도 같이 고친다.**
 */
const NOTES = [
  '원점수는 맞힌 문항의 배점 합계임. 3점 10문항, 2점 10문항으로 50점 만점임.',
  '표준점수는 원점수 30점을 100으로 두고 9점마다 20점씩 더하거나 뺀 점수임. (50점 144, 30점 100, 10점 56)',
  '백분위는 평균 30점, 표준편차 9점의 정규분포에서 그 점수보다 낮은 비율이며 1에서 99로 표기함. (40점 87, 30점 50, 20점 13)',
  '등급은 원점수 46점 이상 1등급, 41점 이상 2등급, 37점 이상 3등급, 33점 이상 4등급, 28점 이상 5등급, 24점 이상 6등급, 19점 이상 7등급, 14점 이상 8등급, 13점 이하 9등급임.',
]

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
      className={`${CARD_W} ${CARD_TEXT} mx-auto border-[1.5px] border-line bg-white px-5 py-8 text-ink md:px-8`}
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

      {/* 좁은 화면에서는 수험번호와 성명이 한 줄씩 — 나란히 두면 서로 밀어낸다 */}
      <div className="mb-7 flex flex-col gap-1 font-semibold md:flex-row md:justify-between md:gap-0">
        <p>
          수험번호 <span className="ml-1 font-normal">{examinee.id}</span>
        </p>
        <p className="m-0 flex text-md">
          성명
          <SignatureMark src={examinee.signature} className="ml-1 h-[22px] w-auto object-contain" />
        </p>
      </div>

      <table className="w-full mb-7 border-collapse text-center [&_th]:border [&_th]:border-line [&_th]:py-3 [&_td]:border [&_td]:border-line [&_td]:py-3">
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

      <ol className="list-decimal list-outside pl-5 text-sm mb-7">
        {NOTES.map((note) => (
          <li className="my-2" key={note}>{note}</li>
        ))}
      </ol>

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
