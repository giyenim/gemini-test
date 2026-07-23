# Resume notes

## 현재 상태 (2026-07)

- `exam-app/`: 수능형 2단 시험지, PDF 기준 842×1191
- **자동 레이아웃**(데스크톱): 측정 → `packSheet` → 렌더 (`LAYOUT.md` / `layout/`)
- **모바일**(≤767px): `MobileExamView` 세로 스크롤 — 지문+연결 문제 묶음, PC와 같은 시험지 분위기
- 문제 컴포넌트: `components/question/` (데스크톱·모바일 공용)
- 샘플 데이터: 레이아웃 케이스용 지문·문제 여러 세트 (`exam-sample.json`)
- 1페이지 헤더 / 2페이지~ 속지 헤더·푸터 정리됨
- GitHub Pages: `base: /gemini-test/`

## Next

- 레퍼런스 PDF 기준 문항 1–34 / 전체 페이지 데이터 확장
- 채점하기 / 답안 현황 UI 재도입 (레이아웃 안정화 후)
- 모바일 UX(문항 점프·답안 현황 바 등)는 필요 시 추가

## Run

```bash
cd exam-app
npm install
npm run dev    # http://localhost:5173/gemini-test/
```

자세한 규칙은 `exam-app/LAYOUT.md`, 에이전트 안내는 `AGENTS.md`.
