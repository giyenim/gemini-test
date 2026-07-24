# AGENTS.md

이 저장소에서 작업하는 에이전트를 위한 안내이다.

## 프로젝트

수능형 시험지 UI (`exam-app/`). React 19 + Vite + Tailwind 4 + Noto Serif KR.  
GitHub Pages 배포 (`base: /gemini-test/`).

목표: **임의의 지문·문제 JSON**이 들어오면 2단 시험지 레이아웃이 **자동**으로 잡힌다. left/right를 수동 하드코딩하지 않는다.  
데스크톱은 `ExamSheet` 2단 패킹, **모바일(≤767px)** 은 `MobileExamView` 가로 스와이프 페이지(지문 묶음 / 단일 문제).

## 필수 문서

| 문서 | 내용 |
|------|------|
| [`exam-app/LAYOUT.md`](exam-app/LAYOUT.md) | 콘텐츠 단·페이지 배치 규칙 (여백·지문 흐름·문제 패킹) |
| [`exam-app/README.md`](exam-app/README.md) | 앱 개요·실행 |
| [`레퍼런스/국어영역_문제지.pdf`](레퍼런스/국어영역_문제지.pdf) | 시각·구성 레퍼런스 |

레이아웃·여백을 바꿀 때는 **먼저 `LAYOUT.md`와 `src/layout/constants.ts`를 확인**한다.

## 디렉터리

```
exam-app/
  src/
    App.tsx                 # 데스크톱/모바일 분기, 스케일/스테이지
    components/
      ExamSheet.tsx         # (데스크톱) 측정 → pack → 렌더
      MobileExamView.tsx    # (모바일) 가로 스와이프 페이지, 지문 묶음/단일 문제
      examText.tsx          # 공통 하이라이트 텍스트
      SheetHeaderFirst.tsx  # 1페이지 헤더
      SheetHeaderContinued.tsx  # 2페이지~ (페이지 번호 + 홀수형 뱃지)
      SheetFooter / SheetContent / SheetColumn
      question/             # PassageBlock, QuestionBlock, ChoiceGroup, ViewBox, GeneralBlock
    layout/                 # packSheet, constants, types (데스크톱 전용)
    data/exam-sample.json   # 레이아웃 케이스용 샘플
    types/exam.ts
  LAYOUT.md
```

## 반응형

| 구간 | 뷰 | 동작 |
|------|-----|------|
| `max-width: 767px` | `MobileExamView` | 가로 스와이프 페이지. 지문+`questionIds` 묶음 / 단일 문제는 1페이지 1문제. 페이지 안 세로 스크롤 |
| `768px` 이상 | `ExamSheet` | 기존 2단 자동 패킹 (`LAYOUT.md`) |

모바일도 배경 `#2a2a2a` · 흰 지 · Noto Serif KR · 그림자/라운드 카드 없음 (PC와 동일 분위기).

## 레이아웃 엔진 (요약 · 데스크톱)

1. **Measure** — 단 너비로 지문·문제 높이 측정  
2. **Pack** — `packSheet()` (`LAYOUT.md` 규칙)  
3. **Render** — 페이지별 Header / 2단 Content / Footer  

핵심 상수 (`layout/constants.ts`):

| 상수 | 역할 | 현재 |
|------|------|------|
| `COLUMN_TOP` | 단 시작·지문 직후 문제 상단 여백 | 14 |
| `MIN_QUESTION_GAP` | 문제 사이 최소 간격 | 112 |
| `QUESTION_TO_PASSAGE_GAP` | 문제 다음 새 지문 간격 (= 위와 동일) | 112 |
| `MAX_QUESTIONS_PER_COLUMN` | 한 단 최대 문제 수 | 3 |

## 실행

```bash
cd exam-app
npm install
npm run dev    # http://localhost:5173/gemini-test/
npm run build
```

## 코딩 규칙

- UI는 Tailwind 유틸 우선. 폰트는 Noto Serif KR.
- 배경 `#2a2a2a`, 시험지 그림자 없음.
- 한글 주석·문자열이 깨지면 반드시 복구한다.
- 레이아웃 동작 변경 시 `LAYOUT.md`도 함께 갱신한다.
- 커밋/푸시는 사용자가 요청할 때만 한다.

## 하지 말 것

- 단별 콘텐츠 수동 배치로 되돌리기
- 문제를 단 중간에 잘라 이어 붙이기
- `LAYOUT.md`와 다른 여백 규칙을 코드에만 조용히 넣기
