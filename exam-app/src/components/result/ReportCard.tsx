import type { Ref } from 'react'
import type { ExamScore } from '../../grade'
import type { Examinee, ExamMeta } from '../../types/exam'

/**
 * 발급 기관명.
 * RESULT-PAGE.md §8 에 정확한 명칭이 미결로 남아 있다. 확정되면 여기만 고친다.
 */
const ISSUER = '이지스퍼블리싱 평가원'

interface ReportCardProps {
  meta: ExamMeta
  examinee: Examinee
  score: ExamScore
  /** 이미지로 저장할 때 잘라낼 영역 — 이 카드가 곧 캡처 경계다 */
  captureRef?: Ref<HTMLDivElement>
}

function HeadCell({ children }: { children: string }) {
  return (
    <th className="border border-line px-2 py-1.5 text-[12px] font-semibold">{children}</th>
  )
}

/**
 * 성적통지표 카드 — 수능 성적통지표 양식 (RESULT-PAGE.md §2).
 *
 * **이미지로 저장되는 유일한 영역**이므로 캡처 경계를 이 컴포넌트의 바깥 div 하나로 둔다.
 * 안에 기관명·시험명이 박혀 있어 이미지 자체가 책 홍보물이 된다.
 */
export function ReportCard({ meta, examinee, score, captureRef }: ReportCardProps) {
  return (
    <div
      ref={captureRef}
      className="mx-auto w-full max-w-[420px] border-[1.5px] border-line bg-white px-6 py-7 font-report text-ink"
    >
      {/* 시험명과 문서명을 한 줄에 둔다 — 실물 통지표의 머리글 한 줄과 같게 */}
      <header className="flex items-baseline justify-center gap-1.5 whitespace-nowrap text-center">
        <span className="text-[12px] tracking-[-0.02em]">
          {meta.year} {meta.title}
        </span>
        <span className="text-[12px] tracking-[0.06em]">성적통지표</span>
      </header>

      <div className="mt-6 flex items-end justify-between gap-4 text-[12.5px]">
        <p className="m-0">
          수험번호 <span className="ml-1 font-write text-[13px]">{examinee.id}</span>
        </p>
        <p className="m-0">
          성명 <span className="ml-1 font-write text-[13px]">{examinee.name}</span>
        </p>
      </div>

      <table className="mt-2.5 w-full border-collapse text-center">
        <thead>
          <tr>
            <HeadCell>영역</HeadCell>
            <HeadCell>원점수</HeadCell>
            <HeadCell>표준점수</HeadCell>
            <HeadCell>백분위</HeadCell>
            <HeadCell>등급</HeadCell>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-line px-2 py-3 text-[12.5px] leading-tight">
              {meta.subject.replace(/\s+/g, ' ')}
            </td>
            <td className="border border-line px-2 py-3 text-[14px]">
              {score.earned}
              <span className="text-[11px] text-ink-muted">/{score.max}</span>
            </td>
            <td className="border border-line px-2 py-3 text-[14px]">{score.standard}</td>
            <td className="border border-line px-2 py-3 text-[14px]">{score.percentile}</td>
            {/* 등급을 가장 크게 — 공유 욕구를 만드는 값이다 (§2) */}
            <td className="border border-line px-2 py-1 text-[30px] font-bold leading-none">
              {score.grade}
            </td>
          </tr>
        </tbody>
      </table>

      {/*
        비고란 — 지금은 비워 둔다.
        부정행위 감지가 붙으면 여기에 무효 처리 문구가 들어간다 (RESULT-PAGE.md §6).
      */}
      <div className="mt-2 min-h-[26px] border border-line px-2 py-1.5 text-[11px] leading-snug text-ink-muted">
        <span className="mr-1.5 font-semibold text-ink">비고</span>
      </div>

      <footer className="mt-7 text-center">
        <p className="m-0 text-[12.5px]">{examinee.takenAt}</p>
        <div className="mt-1.5 flex items-center justify-center gap-2">
          <p className="m-0 text-[15px] font-bold tracking-[0.02em]">{ISSUER}</p>
          {/* 직인 */}
          <span
            aria-label="직인"
            className="inline-flex h-[30px] w-[30px] rotate-[-8deg] items-center justify-center rounded-full border-[1.5px] border-check text-[9px] leading-none font-bold text-check"
          >
            이지스
          </span>
        </div>
      </footer>
    </div>
  )
}
