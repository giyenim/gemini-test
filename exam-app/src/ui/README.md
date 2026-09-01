# UI 킷

시험지 **밖** 화면 요소를 모아 두는 곳 (버튼·배지·입력칸·띠).

| 요소 | 쓰는 곳 |
|------|---------|
| `PageTurnButton` | 쪽 넘김, 성적표의 책·공유 링크 |
| `SubmitButton` / `SubmitButtonFace` | 시험지 마지막 쪽의 제출 |
| `ProgressBar` | `채점 중` 화면의 채워지는 띠 |
| `PaperWindow` · `IconButton` | 채점표·오답노트·서명 창 |
| `SignatureModal` | 표지 성명 칸 |

손그림 요소는 **획 굵기 2 와 `vector-effect="non-scaling-stroke"`** 를 함께 쓴다.
한 벌로 보이려면 여기서 어긋나면 안 된다.

`SubmitButtonFace` 와 `ProgressBar` 는 **생김새만** 맡고 상태를 밖에서 받는다.
저 혼자 단계를 넘기거나 시간을 재면 작업장에서 중간 모양을 붙잡고 그릴 수가 없다.
시험지 안(문항·보기·표·헤더)은 `components/` 에 그대로 둔다.

`npm run dev` → http://localhost:5173/?ui — 킷 전체를 늘어놓는 자리

띠(`ProgressBar`)를 고칠 때는 http://localhost:5173/?bar — **채점 중 화면을 그대로
멈춰 세운다.** 띠는 3초면 다 차고 화면이 넘어가 버려 붙잡고 그릴 수가 없어서 둔 옆문이다.
`?bar=3`, `?bar=97`, `?bar=100` 처럼 값을 주면 그 자리에서 선다 — 양 끝이 어렵다.
