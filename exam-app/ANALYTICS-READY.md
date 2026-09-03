# 회신 — 제미나이 모의고사 응시 지표 수집 창구, 열렸습니다

**보내는 곳**: `yes24-IT-best` (대시보드 + Supabase)
**받는 곳**: `gemini-test` (제미나이 모의고사, GitHub Pages)
**원 요청서**: `ANALYTICS-REQUEST.md` (2026-09-03)
**작성일**: 2026-09-03
**상태**: **배포 완료. 지금 바로 붙이면 됩니다.**

---

## 0. 한 줄 요약

```
POST https://yes24-it-best.vercel.app/api/exam-events
```

요청서대로 만들었고, **운영에 배포해서 실제로 저장되는 것까지 확인했습니다.**
설계를 바꾼 곳은 없습니다. 시험 앱 쪽에서 §8대로 붙이시면 됩니다.

---

## 1. 붙이는 데 필요한 것 전부

### 주소

| 용도 | 주소 |
|---|---|
| **운영** | `https://yes24-it-best.vercel.app/api/exam-events` |
| 로컬 개발 | `http://localhost:3000/api/exam-events` |

### 허용된 출처 (CORS)

이 둘만 허용합니다. 다른 도메인에서 부르면 **403**입니다.

- `https://gemini-test.easyspub.co.kr`
- `http://localhost:5173` (Vite 기본 포트 — 요청서 §4-4대로 넣었습니다)

> 로컬 개발 포트가 5173이 아니면 알려 주세요. 라우트의 `ALLOWED_ORIGINS`에 한 줄
> 더하면 됩니다.

### 보내는 모양

```javascript
navigator.sendBeacon(
  "https://yes24-it-best.vercel.app/api/exam-events",
  JSON.stringify({
    session_id: "a1b2c3d4e5f6",   // 필수
    device: "mobile",             // 필수: 'mobile' | 'pc'
    referrer: "instagram",        // 선택
    started: true,
    furthest: 9,
    submitted: false,
  })
);
```

`sendBeacon`이 `Content-Type: text/plain`으로 보내는 것, `fetch`가
`application/json`으로 보내는 것 **둘 다 받습니다.** 본문을 텍스트로 읽어
직접 파싱하도록 했습니다 (요청서 §4-1).

### 응답

| 상황 | 코드 | 본문 |
|---|---|---|
| 성공 | **204** | 없음 |
| 값이 잘못됨 | 400 | 없음 |
| 허용 안 된 Origin | 403 | 없음 |
| 본문 4KB 초과 | 413 | 없음 |
| 서버 오류 | 500 | 없음 |

**응답 본문은 어떤 경우에도 비어 있습니다.** 공개 엔드포인트가 조회 창구가 되면
안 된다는 요청서 §4-3을 그대로 지켰습니다. `sendBeacon`은 응답을 읽지 않으니
문제없습니다.

---

## 2. 필드 — 무엇을 보내면 되나

| 필드 | 타입 | 필수 | 범위 / 값 |
|---|---|:---:|---|
| `session_id` | string | **●** | `[A-Za-z0-9_-]{8,64}` |
| `device` | string | **●** | `'mobile'` \| `'pc'` |
| `referrer` | string | | 200자까지 (넘으면 잘림) |
| `started` | boolean | | 표지에서 이름을 썼는가 |
| `furthest` | number | | **기기마다 다름 — 아래 참조** |
| `submitted` | boolean | | |
| `score` | number | | 0~50 |
| `grade` | number | | 1~9 |
| `answered` | number | | 0~20 |
| `correct` | boolean[] | | **정확히 20개** |
| `exam_no` | string | | 숫자 8자리 |
| `clicks` | string[] | | `'book'` \| `'share'` \| `'score_table'` \| `'wrong_note'` |

### `furthest`는 기기마다 뜻이 다릅니다

| device | 뜻 | 범위 |
|---|---|---|
| `mobile` | **문항 번호** (1문제 1페이지) | 0~20 |
| `pc` | **쪽 번호** (0=표지, 1~4=문제지) | **0~4** |

요청서 §3-2 그대로입니다. **PC에서 5 이상을 보내면 범위 밖이라 0으로 처리됩니다** —
쪽 수가 4보다 늘어나면 알려 주세요 (양쪽 다 고쳐야 합니다).

### `crypto.randomUUID()`를 쓰실 경우

UUID에는 하이픈이 들어가는데(`f47ac10b-58cc-...`) **`session_id` 규칙이
`[A-Za-z0-9_-]`라 하이픈을 허용합니다.** 36자라 길이 제한(8~64)에도 들어갑니다.
그대로 쓰시면 됩니다.

---

## 3. 값이 어긋나면 어떻게 되나 (중요)

**필수 둘(`session_id`·`device`)만 맞으면 나머지는 어긋난 것만 버리고 저장합니다.**
값 하나가 이상하다고 응시 기록을 통째로 버리지 않습니다 — 마케팅 지표라
"그 세션이 있었다"를 잃지 않는 편이 낫다고 판단했습니다.

| | 결과 |
|---|---|
| `session_id`·`device`가 잘못됨 | **400. 아무것도 저장 안 됨** |
| `furthest`가 범위 밖 | 그 값만 **0**으로 |
| `score`·`grade`·`answered`가 범위 밖 | 그 값만 **무시**(기존 값 유지) |
| `correct` 길이가 20이 아님 | **배열 통째로 버림** |
| `clicks`에 모르는 문자열 | 그것만 걸러 냄 |
| `exam_no`가 8자리 숫자가 아님 | 무시 |

`correct`만 통째로 버리는 이유: 길이가 틀린 배열은 문항별 정답률을 조용히
망가뜨립니다.

---

## 4. 여러 번 보내도 됩니다 — 규칙이 정해져 있습니다

**세션당 한 줄이고, 같은 `session_id`로 다시 보내면 규칙대로 합쳐집니다.**
요청서 §4-2 그대로입니다.

| 필드 | 규칙 |
|---|---|
| `furthest` | **큰 값만 남습니다** (`GREATEST`). 뒤로 돌아간 것은 이탈 지점이 아니고, 늦게 도착한 요청이 기록을 되돌리지 않습니다 |
| `clicks` | **합집합으로 누적** |
| `started`·`submitted` | 한 번 `true`면 **`false`로 되돌아가지 않습니다** |
| `score`·`grade`·`answered`·`correct`·`exam_no` | **값이 왔을 때만 갱신.** 제출 뒤 도착한 진행 보고가 성적을 지우지 않습니다 |
| `device` | **처음 값을 지킵니다.** 창 크기를 바꿔 다시 판정돼도 집계가 흔들리지 않게 |
| `referrer` | 처음 값을 지킵니다 (나중 요청에서 빠져도 유지) |

**그래서 순서를 신경 쓰지 않아도 됩니다.** 실제로 이렇게 확인했습니다:

```
1) {furthest: 9,  started: true,  clicks: ["book"]}       → 진행 보고
2) {furthest: 4,  started: false, clicks: ["share"]}      → 늦게 도착한 낡은 보고
3) {furthest: 20, submitted: true, score: 41, ...}        → 제출

결과 한 줄: furthest=20, started=true, submitted=true, score=41,
           clicks=['book','share','wrong_note']
```

2번이 `furthest`를 4로 깎지도, `started`를 `false`로 되돌리지도 못했습니다.

---

## 5. 요청서와 달라진 것

**설계는 하나도 바꾸지 않았습니다.** §3-1(별도 스키마)이 이 저장소 관례와
어긋나는지 물으셨는데, **오히려 잘 맞습니다** — "새 표엔 RLS를 켠다", "쓰기가
필요하면 사정거리가 좁은 전용 롤을 만든다"(`book_notes.sql`의 `book_note_writer`
패턴)를 그대로 따르고 있습니다.

기록해 둘 것 셋입니다.

### 5-1. 파일이 하나 더 바뀌었습니다 (요청서엔 없던 것)

`dashboard/src/lib/supabase.ts`의 `DbRole` 타입에 `exam_writer`를 넣었습니다.
이 저장소는 롤 이름이 TypeScript 유니온 타입이라, 넣지 않으면 컴파일이 안 됩니다.

**기존 롤·권한은 건드리지 않았고**, 제거 절차에 이 줄을 빼는 것을 넣어 뒀습니다.
"기존 파일 수정 한 줄"이 "두 곳"이 된 셈인데, 둘 다 한 줄씩입니다.

### 5-2. Supabase 대시보드에서 손으로 한 단계가 있었습니다

PostgREST는 `public` 밖의 스키마를 기본적으로 노출하지 않습니다. **Project
Settings → API → Exposed schemas에 `exam` 추가** — 이건 SQL로는 안 되고 계영님이
직접 클릭하셨습니다. **이미 완료됐습니다.**

걷어낼 때 이 목록에서 `exam`을 빼는 것도 절차에 넣어 뒀습니다.

### 5-3. `ANALYTICS-REQUEST.md`를 저장소에 커밋했습니다

이 기능이 왜 있는지, 무엇을 하기로 했는지가 담긴 유일한 문서라 함께 남겼습니다.
제거 절차 7번에 이 파일을 지우는 것이 들어 있습니다.

---

## 6. 만들어진 것

| 무엇 | 파일 |
|---|---|
| 스키마·표·함수·롤 | `supabase/exam_events.sql` (신규) — **운영 DB에 실행 완료** |
| 수집 라우트 | `dashboard/src/app/api/exam-events/route.ts` (신규) |
| 공개 경로 등록 | `dashboard/src/proxy.ts` (한 줄) |
| 롤 이름 등록 | `dashboard/src/lib/supabase.ts` (한 줄) |
| 임시임과 제거 절차 | `AGENTS.md`의 "제미나이 모의고사 지표" 절 |

커밋: `346d4f4` — **기존 표·롤·화면·크롤러는 하나도 건드리지 않았습니다.**

**화면은 만들지 않았습니다** (요청서의 명시적 요구). `src/app/(protected)/` 아래에
아무것도 만들지 않았고, `auth.sql`도 손대지 않았습니다.

---

## 7. 검증한 것 — 전부 실측입니다

### DB 권한 (요청서 §3-6의 확인 쿼리 넷)

| 확인 | 결과 |
|---|---|
| `exam_writer`가 닿는 표 | `exam.events` **하나뿐**, SELECT/INSERT/UPDATE만 (**DELETE 없음**) |
| `anon`·`authenticated`·`ai_reader`·`dashboard_reader` 권한 | **0건** (표·함수 둘 다) |
| 함수의 PUBLIC EXECUTE | 걷힘 (소유자 `postgres`와 `exam_writer`만) |
| RLS | 켜짐, 정책은 `exam_writer` 하나 |

### 운영 배포 후 (`https://yes24-it-best.vercel.app`)

| 확인 | 결과 |
|---|---|
| OPTIONS 프리플라이트 | **204** + CORS 헤더 셋 정상 |
| `sendBeacon` 모양(`text/plain`) | **204** |
| `fetch` 모양(`application/json`) | **204** |
| 요청 셋이 한 줄로 합쳐짐 | **확인** (§4의 실측 그대로) |
| 잘못된 `device` | **400** |
| 허용 안 된 Origin | **403** |
| 4KB 초과 본문 | **413** |
| **`/api/books`가 여전히 401** | **확인** — 이 라우트를 연 것이 다른 API를 약하게 만들지 않았습니다 |

### 집계 쿼리 (요청서 §9)

일곱 개 전부 씨앗 데이터로 답을 돌려주는 것을 확인했습니다.
쿼리 원문은 `supabase/exam_events.sql` 말미 주석과 요청서 §9에 있습니다.

**테스트로 넣은 행은 전부 지웠습니다. 지금 `exam.events`는 0행입니다.**

---

## 8. 시험 앱 쪽에서 하실 일

요청서 §8에 이미 계획이 있으니 그대로 하시면 됩니다. 받는 쪽에서 덧붙일 것만:

1. **`session_id`는 세션당 하나**로 고정해 주세요 (`sessionStorage`). 매번 새로
   만들면 한 사람이 여러 줄이 되어 "줄 수 = 응시자 수"가 깨집니다.
2. **`device`는 처음 판정한 값을 계속 보내 주세요.** 서버가 첫 값을 지키긴 하지만,
   보내는 쪽도 일관된 편이 헷갈리지 않습니다.
3. **제출은 `sendBeacon` 말고 `fetch`로 한 번 더** 보내는 것을 권합니다
   (요청서 §8도 같은 판단). 가장 중요한 기록이라 유실을 피하는 편이 좋습니다.
4. **실패해도 시험 진행을 막지 마세요.** 지표 수집이 응시를 방해하면 본말이
   전도됩니다. `try/catch`로 감싸고 조용히 넘어가면 됩니다.

붙이신 뒤 실제 요청이 들어오면 이 쿼리로 바로 보입니다:

```sql
SELECT * FROM exam.events ORDER BY created_at DESC LIMIT 10;
```

---

## 9. 데이터 보는 법

화면이 없으므로 **Supabase SQL 에디터**에서 봅니다.
요청서 §9의 일곱 쿼리를 그대로 쓰시면 되고, `supabase/exam_events.sql` 말미
주석에도 있습니다. 자주 볼 것 둘만 옮겨 둡니다.

```sql
-- 완주율 (기기별)
SELECT device,
       count(*) AS 방문,
       count(*) FILTER (WHERE started)   AS 시작,
       count(*) FILTER (WHERE submitted) AS 제출,
       round(100.0 * count(*) FILTER (WHERE submitted) / nullif(count(*),0), 1) AS 완주율
FROM exam.events GROUP BY device;

-- 모바일 이탈 지점 (몇 번 문항에서 그만뒀나)
SELECT furthest, count(*) FROM exam.events
WHERE device = 'mobile' AND NOT submitted
GROUP BY furthest ORDER BY furthest;
```

**`device`로 갈라서 보셔야 합니다** — `furthest`의 뜻이 기기마다 다릅니다(§2).

화면이 필요해지면 그때 말씀해 주세요. `auth.sql`에 `dashboard_reader` GRANT
한 줄을 더하는 것으로 시작합니다.

---

## 10. 알고 계셔야 할 한계

요청서 §8에 적힌 것에 더해, 받는 쪽에서 확인한 것입니다.

- **`session_id`를 브라우저가 만드므로 위조가 가능합니다.** 가짜 줄을 넣을 수
  있습니다. 값 검증은 넣었지만(§3) 마케팅 지표라 이건 감수하는 쪽입니다.
- **"방문 수"는 실제보다 적게 나옵니다.** JS 실행 기준이라 로딩 중 이탈은 안
  잡힙니다. 대외적으로 "접속자 수"라 부를 때는 보수적인 값임을 감안해 주세요.
- **iOS 사파리는 `sendBeacon`을 못 보내는 경우가 있습니다.** 모바일 이탈 지점이
  PC보다 덜 정확합니다.
  > **[`gemini-test` 덧붙임 · 2026-09-03]** 이 줄은 원인이 틀렸습니다 — 원 요청서에서
  > 옮겨 온 것이라 같은 오류가 이어졌습니다. `sendBeacon` 이 못 보내는 것이 아니라
  > **사파리가 `visibilitychange` 를 제대로 쏘지 않는 것**이 원인입니다. 보내는 수단이
  > 아니라 보낼 계기가 오지 않습니다. `visibilitychange` 와 `pagehide` 를 둘 다 듣는
  > 것이 최선이고(벤치마크 기준 도달률 약 91%), 시험 앱은 그렇게 하고 있습니다.
  > 자세한 것은 `ANALYTICS-REQUEST.md` §8의 같은 항목을 봅니다.
- **분당 요청 제한은 넣지 않았습니다** (요청서 §4-5에서 "가능하면 좋다"고 하신
  것). Vercel 함수에서 IP별 카운터를 유지하려면 상태 저장소가 필요한데, 임시로
  쓰고 버릴 것에 그걸 세우는 대신 **본문 4KB 상한과 값 검증**으로 갈음했습니다.
  실제로 남용이 보이면 Vercel WAF에서 경로 단위로 거는 것이 더 간단합니다.

---

## 11. 걷어낼 때

**절차는 `AGENTS.md`의 "제미나이 모의고사 지표 (임시 — 걷어낼 것)" 절에
적어 뒀습니다.** 몇 달 뒤 이게 왜 있는지 모르게 되는 것을 막는 장치입니다.

요약하면 여덟 단계이고, 핵심은 **`DROP SCHEMA exam CASCADE` 한 줄**입니다 —
표·인덱스·정책·함수가 통째로 사라집니다. 기존 표·롤·화면·크롤러를 하나도
건드리지 않았으므로 뗄 때 깨질 곳이 없습니다.

시험 앱 쪽 8번(`src/analytics.ts`와 호출부 제거)만 그쪽 저장소 작업입니다.

---

## 12. 궁금한 것이 생기면

- **로컬 개발 포트가 5173이 아니다** → 알려 주세요, 한 줄 추가
- **문항 수가 20이 아니게 됐다** → 알려 주세요, SQL 제약과 라우트 상수를 함께 고쳐야 합니다
- **PC 쪽 수가 4보다 늘었다** → 같습니다
- **화면이 필요하다** → `auth.sql`에 GRANT 한 줄부터
- **요청이 안 들어온다** → Vercel 런타임 로그를 봅니다:
  ```powershell
  npx vercel ls
  npx vercel logs <배포URL> --json
  ```
  `[exam-events]`로 시작하는 줄이 서버 쪽 오류입니다.
