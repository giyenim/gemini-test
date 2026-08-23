/**
 * 성명 칸 표식과 그 칸을 대신 누르는 길 — 컴포넌트가 아니라서 `SignaturePad.tsx`
 * 밖으로 나왔다. 한 파일이 컴포넌트와 그 밖의 것을 같이 내보내면 Fast Refresh 가
 * 상태를 잃는다 (oxlint `react(only-export-components)`).
 */

/**
 * 성명 칸에 붙는 표식 — 시험지 밖의 조작부(쪽 넘김)가 이 칸을 찾아 대신 누른다.
 * props 로 여닫지 않는 것은, 칸이 두 컴포넌트 갈래의 끝에 있어 상태를 끌어올리면
 * 중간 네 곳이 상관없는 prop 을 나르게 되기 때문이다.
 */
export const SIGNATURE_FIELD_ATTR = 'data-signature-field'

/** 표지의 성명 칸을 눌러 서명 창을 연다. 표지가 떠 있지 않으면 아무 일도 없다. */
export function openSignatureField() {
  document
    .querySelector<HTMLButtonElement>(`[${SIGNATURE_FIELD_ATTR}]`)
    ?.click()
}
