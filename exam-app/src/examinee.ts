import type { Examinee } from './types/exam'

/**
 * 응시자 발급 — 이름만 받고 수험 번호는 응시 시각으로 만든다.
 *
 * 번호는 `YYMMDD` + 2자리 일련으로 8자리다. 시험지 헤더의 수험 번호 칸이
 * 4자리–4자리라 그 칸에 한 글자씩 그대로 들어간다 (`SheetHeaderFirst`).
 */
export function issueExaminee(name: string, now: Date = new Date()): Examinee {
  const yy = String(now.getFullYear() % 100).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const serial = String(Math.floor(Math.random() * 100)).padStart(2, '0')

  return {
    name: name.trim(),
    id: `${yy}${mm}${dd}${serial}`,
    takenAt: `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`,
  }
}
