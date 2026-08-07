/**
 * 제출 → 성적표 사이에 끼우는 대기 화면 (RESULT-PAGE.md §1).
 *
 * 즉시 띄우지 않고 3초를 끄는 것만으로 체감이 크게 올라간다. 타이머는 App 이 잡는다.
 */
export function GradingOverlay() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 bg-white font-serif text-ink">
      <div
        aria-hidden
        className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-transparent"
      />
      <p className="m-0 text-[15px] tracking-[0.02em]" role="status">
        채점 중입니다
      </p>
    </div>
  )
}
