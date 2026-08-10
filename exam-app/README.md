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

https://gemini-test.easyspub.co.kr — 커스텀 도메인이라 사이트가 **루트**에 놓이고, 그래서
Vite `base` 가 `'/'` 다. 옛 주소(`giyenim.github.io/gemini-test/`)로 들어오면 GitHub 이 이
도메인으로 301 을 보낸다. 도메인 이름은 저장소 Settings → Pages 에 저장되어 있다
(Actions 배포에서는 `CNAME` 파일이 따로 필요 없다).

> `base` 를 저장소 경로(`'/gemini-test/'`)로 되돌리면 번들과 그림을 `/gemini-test/...` 에서
> 찾다가 전부 404 가 나고 **화면이 빈 채로 뜬다.**

`main` 에 푸시하면 [`deploy-pages.yml`](../.github/workflows/deploy-pages.yml) 이 `npm run build`
후 `dist` 를 Pages 아티팩트로 올린다. **빌드 결과는 저장소에 커밋하지 않는다** — 저장소 Settings →
Pages 의 소스가 **GitHub Actions** (`build_type: workflow`) 여야 이 워크플로가 실제로 서빙된다.

> 예전에는 `dist` 를 저장소 루트에 되커밋하고 Pages 가 `main` 의 `/` 를 서빙했다. 그때는 해시가
> 바뀐 옛 번들이 `assets/` 에 계속 쌓였다. 루트의 `index.html`·`assets/`·`figures/` 는 그 방식의
> 잔재이므로 되살리지 않는다 — `.gitignore` 가 막고 있다.
