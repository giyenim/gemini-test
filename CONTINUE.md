# Resume notes

## 현재 상태 (2026-08)

- **시험지 완성** — 제미나이 활용 능력 모의고사 20문항 · **4쪽** · 50점(3점 10 + 2점 10)
  - 데스크톱 `ExamSheet`: 2단 자동 패킹, 단당 2~3문항, 수능 과학탐구 규격
  - 모바일 `MobileExamView`(≤767px): 가로 스와이프, **1문제 1페이지**(20페이지)
  - 제출 → 채점(○/✕)·총점 → `답지 보기`(정답표)
- **레이아웃 엔진**: 지문 없는 **단일 문제**를 지원 (`PackItem` = 지문 묶음 / 단일 문제 구간)
- **문항 블록**: `general`(자료) `table`(표) `figure`(그림) `text`(질문 문장) `view`(보기)
- **출제 근거**: [`book/`](book/) — 교재 PDF를 장별 Markdown으로 변환 (`tools/build_book_md.py`)
- **후보 문항**: [`exam/후보문항-40.md`](exam/후보문항-40.md) 40제 · 정답 · 해설. 이 중 20문항을 시험지에 실었다

## 남은 일

- **그림 1개 미완성** — 17번(동영상 생성) `16:9 / 9:16 비율 도식`이 점선 자리로 비어 있다.
  `exam-app/src/data/exam-sample.json`의 `figure` 블록에 `srcs: ["파일명.png"]`를 넣으면 채워진다
  (파일은 `exam-app/public/figures/`에 둔다)
- 05~07장이 추가되면 `tools/build_book_md.py`의 `SOURCES`에 PDF·장 범위를 더해 `book/`을 늘린다
- 문항 교체 시: 후보 40제에서 골라 JSON을 수정한 뒤 **쪽수가 4인지 확인**한다

```js
// 브라우저 콘솔
document.querySelectorAll('[data-page]').length   // 4여야 한다
```

## Run

```bash
cd exam-app
npm install
npm run dev    # http://localhost:5173/gemini-test/
```

자세한 규칙은 `exam-app/LAYOUT.md`, 에이전트 안내는 `AGENTS.md`.
