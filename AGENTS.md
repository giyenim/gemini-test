# AGENTS.md

이 저장소에서 작업하는 에이전트를 위한 안내이다.

## 프로젝트

**이지스 AI 활용 능력 모의고사** — 수능 과학탐구 형식의 시험지 UI (`exam-app/`).
React 19 + Vite + Tailwind 4 + Noto Serif KR.
GitHub Pages 배포 — 커스텀 도메인 https://gemini-test.easyspub.co.kr (`base: '/'`, `exam-app/README.md` 배포 절 참고).

- 출제 범위: 이지스퍼블리싱 『구글 제미나이』 01~04장 → [`book/`](book/)에 장별 Markdown
- 현재 시험지: **표지 1장 + 20문항 · 4쪽 · 50점**(3점 10 + 2점 10). 전부 단일 문제(지문 없음)
- 후보 문항 40제와 해설: [`exam/후보문항-40.md`](exam/후보문항-40.md)

응시 흐름: **표지 → 시험지 → 채점 중 3초 → 성적통지표**. 되돌아가는 길은 없다.
이름은 표지 성명 칸에 직접 적고, 적는 즉시 속지 헤더와 성적표에 반영된다.
시험지는 항상 채점 전 상태로만 그린다 — 채점 결과는 결과 화면의 채점표·오답노트가 보여 준다.

목표: **임의의 지문·문제 JSON**이 들어오면 2단 시험지 레이아웃이 **자동**으로 잡힌다. left/right를 수동 하드코딩하지 않는다.  
데스크톱은 `ExamSheet` 2단 패킹, **모바일(≤767px)** 은 `MobileExamView` 가로 스와이프 페이지(1문제 1페이지).

## 필수 문서

| 문서 | 내용 |
|------|------|
| [`exam-app/LAYOUT.md`](exam-app/LAYOUT.md) | 콘텐츠 단·페이지 배치 규칙 (여백·문제 패킹·4쪽 맞추기·블록 타입) |
| [`exam-app/RESULT-PAGE.md`](exam-app/RESULT-PAGE.md) | **제출 이후 화면** — 성적통지표·채점표·오답노트 명세와 구현 상태 |
| [`exam-app/README.md`](exam-app/README.md) | 앱 개요·실행 |
| [`book/README.md`](book/README.md) | 원본 교재 Markdown (출제 근거) |
| [`exam/후보문항-40.md`](exam/후보문항-40.md) | 후보 문항·정답·해설 |
| [`레퍼런스/01 물리학Ⅰ_문제.pdf`](레퍼런스/) | 문항 유형·조판 레퍼런스 (과탐) |

레이아웃·여백을 바꿀 때는 **먼저 `LAYOUT.md`와 `src/layout/constants.ts`를 확인**한다.

## 디렉터리

```
book/                       # 원본 교재 장별 Markdown (출제 근거)
exam/후보문항-40.md          # 후보 문항 40제 · 정답 · 해설
tools/                      # 교재 PDF → book/*.md 변환기, 학생 대화 그림 생성기
exam-app/
  public/figures/           # 문항 그림 (교재 PDF에서 잘라낸 캡처)
  src/
    App.tsx                 # 데스크톱/모바일 분기, 스케일/스테이지
    components/
      CoverSheet.tsx        # 표지 (문제 페이지 앞 한 장, 쪽 번호 없음)
      ExamSheet.tsx         # (데스크톱) 측정 → pack → 렌더
      MobileExamView.tsx    # (모바일) 가로 스와이프, 1문제 1페이지
      result/               # 제출 이후 화면 (RESULT-PAGE.md)
                            # GradingOverlay(채점 중) ResultView(성적표 화면)
                            # ReportCard(성적통지표) ScoreTablePopup WrongNotePopup Modal
      examText.tsx          # 공통 텍스트 렌더 훅
      SheetHeaderFirst.tsx  # 1페이지 헤더 (시험명 / 교시·과목 / 성명·수험 번호)
      SheetHeaderContinued.tsx  # 2페이지~ (페이지 번호)
      SheetFooter / SheetContent / SheetColumn / ExamActionButton
      PageNav.tsx           # 쪽 넘김 (화면 좌우 고정) — 버튼 생김새는 ui/ 킷
      SignaturePad.tsx      # 표지 성명 칸 + 서명 도화지 — 창 생김새는 ui/ 킷
      question/             # QuestionBlock, PassageBlock, ChoiceGroup,
                            # ViewBox(보기) GeneralBlock(자료) TableBlock(표) FigureBlock(그림)
    ui/                     # 시험지 밖 화면 UI 킷 (손그림 스타일) — `?ui` 로 작업장 열림
                            # PageTurnButton, SignatureModal, Workbench
    layout/                 # packSheet, constants, types (데스크톱 전용)
    data/exam-sample.json   # 실제 시험지 데이터 (20문항)
    types/exam.ts
  LAYOUT.md
```

## 반응형

| 구간 | 뷰 | 동작 |
|------|-----|------|
| `max-width: 767px` | `MobileExamView` | 가로 스와이프 페이지. **1페이지 1문제**(지문형이면 지문+묶음 문제). 페이지 안 세로 스크롤 |
| `768px` 이상 | `ExamSheet` | 2단 자동 패킹, **4쪽 고정** (`LAYOUT.md`) |

모바일도 배경 흰색 · Noto Serif KR · 그림자/라운드 카드 없음 (PC와 동일 분위기).

## 레이아웃 엔진 (요약 · 데스크톱)

1. **Measure** — 단 너비로 지문·문제 높이 측정  
2. **Pack** — `packSheet()` (`LAYOUT.md` 규칙)  
3. **Render** — 페이지별 Header / 2단 Content / Footer  

`packSheet()`는 **데이터 순서**대로 `PackItem`(지문 묶음 / 단일 문제 구간)을 배치한다.

핵심 상수 (`layout/constants.ts`):

| 상수 | 역할 | 현재 |
|------|------|------|
| `TARGET_PAGES` / `TARGET_COLUMNS` | 목표 쪽수 / 단 수 — 단별 문항 수를 고르게 맞춘다 | 4 / 8 |
| `COLUMN_TOP` | 단 시작·지문 직후 문제 상단 여백 | 14 |
| `MIN_QUESTION_GAP` / `MAX_QUESTION_GAP` | 문제 사이 최소·최대 간격 | 24 / 96 |
| `MAX_QUESTIONS_PER_COLUMN` | 한 단 최대 문제 수 | 3 |

쪽수가 4를 넘으면 콘텐츠가 넘친 것이다. 그림 `height`와 자료·보기 문장 길이를 줄인다 (`LAYOUT.md` 참고).

## 실행

```bash
cd exam-app
npm install
npm run dev    # http://localhost:5173/  (UI 킷 작업장은 /?ui)
npm run build
```

## 코딩 규칙

- UI는 Tailwind 유틸 우선. 본문 글꼴은 Noto Serif KR, 양식(표지·성적표·헤더)은 조선굴림.
- **요소 기본값(`button` 등)은 `index.css` 의 `@layer base` 안에만 쓴다.** 레이어 밖에 두면
  Tailwind 유틸리티(`@layer utilities`)를 통째로 이겨서 `font-bold` 같은 게 조용히 무시된다.
- 배경 흰색, 시험지 그림자 없음. 쪽 경계는 페이지 사이 **옅은 회색 점선**으로만 표시한다.
- 한글 주석·문자열이 깨지면 반드시 복구한다.
- 레이아웃 동작 변경 시 `LAYOUT.md`도 함께 갱신한다.
- 커밋/푸시는 사용자가 요청할 때만 한다.

## 하지 말 것

- 단별 콘텐츠 수동 배치로 되돌리기
- 문제를 단 중간에 잘라 이어 붙이기
- `LAYOUT.md`와 다른 여백 규칙을 코드에만 조용히 넣기
