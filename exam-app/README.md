# exam-app

수능형 시험지 UI. React 19 + Vite + Tailwind 4 + Noto Serif KR.

임의의 지문·문제 JSON을 넣으면 레이아웃이 자동으로 잡힌다.  
- **데스크톱**: 2단 페이지 패킹 — [`LAYOUT.md`](./LAYOUT.md)  
- **모바일**(≤767px): 가로 스와이프 페이지 — 지문 묶음 / 단일 문제 (`LAYOUT.md` 모바일 규칙)  

저장소 에이전트 안내는 [`../AGENTS.md`](../AGENTS.md).

## 실행

```bash
npm install
npm run dev      # http://localhost:5173/gemini-test/
npm run build
npm run preview
```

## 주요 경로

| 경로 | 역할 |
|------|------|
| `src/App.tsx` | 데스크톱/모바일 분기 (`max-width: 767px`) |
| `src/layout/` | 단·페이지 패킹 (`packSheet`, 여백 상수) — 데스크톱 |
| `src/components/ExamSheet.tsx` | 측정 → 패킹 → 페이지 렌더 |
| `src/components/MobileExamView.tsx` | 모바일 가로 스와이프 페이지 뷰 |
| `src/components/question/` | 지문·문제·선택지·보기 블록 (공용) |
| `src/data/exam-sample.json` | 샘플 시험 데이터 |

## 배포

Vite `base: '/gemini-test/'` — GitHub Pages 프로젝트 사이트용.
