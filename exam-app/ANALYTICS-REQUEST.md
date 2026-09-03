# 개발 요청서 — 제미나이 모의고사 응시 지표 수집

**받는 곳**: `yes24-IT-best` (대시보드 + Supabase)
**보내는 곳**: `gemini-test` (제미나이 모의고사, GitHub Pages)
**작성일**: 2026-09-03
**성격**: **임시.** 마케팅 캠페인 기간에만 쓰고 **끝나면 걷어낸다.** 걷어내기 쉬운 것이 이 설계의 제1 원칙이다.

---

## 0. 한 줄 요약

제미나이 모의고사 응시자가 **어디까지 풀다 이탈했는지**를 알고 싶다.
대시보드에 **API 라우트 하나**와 Supabase에 **격리 스키마 하나**를 만들어 달라.

> ### ⚠️ 화면은 만들지 않는다
>
> 대시보드에 **보여 주는 페이지는 요청하지 않는다.** 지금 필요한 것은
> **① API가 도는 것 ② DB에 데이터가 쌓이는 것** 둘뿐이다.
>
> 집계는 당분간 **Supabase SQL 에디터에서 직접** 본다 (§9에 쿼리를 적어 두었다).
> 화면이 필요해지면 그때 따로 요청하겠다 — 그때는 `auth.sql`에
> `dashboard_reader` GRANT 한 줄을 더하는 것으로 시작하면 된다.
>
> 그러니 `src/app/(protected)/` 아래에는 **아무것도 만들지 말아 달라.**
> 만들 것은 §2의 파일 셋이 전부다.

---

## 1. 배경

`gemini-test`는 이지스퍼블리싱 『된다! 하루 만에 끝내는 제미나이 활용법』 홍보용
모의고사다. 수능 시험지 형식으로 20문항을 풀고 성적표를 받는다.

- 배포: GitHub Pages — **https://gemini-test.easyspub.co.kr**
- 서버가 없다. 정적 호스팅이라 응시 기록을 남길 곳이 없다.
- 그래서 **이 저장소의 Vercel 대시보드를 빌려** 수집 창구로 쓰려 한다.

Vultr VPS가 아니라 Vercel인 이유: VPS는 램 1GB에 크롤러 3종이 이미 빠듯하고
(`DEPLOY.md`), HTTPS 인증서·웹서버를 새로 세워야 한다. 임시로 쓰고 버릴 것에
그 스택을 세울 이유가 없다. Vercel은 라우트 파일 하나면 되고, 뗄 때도 파일 하나다.

### 알고 싶은 것 (우선순위 순)

1. **시험지를 띄우고 바로 이탈했는가** — 표지에서 이름도 안 쓰고 나간 사람
2. **어디서 이탈했는가** — 모바일은 몇 번 문항, PC는 몇 쪽에서
3. **얼마나 제출했는가** — 완주율
4. 점수 분포 (나중에 진짜 등급컷으로 쓴다), 문항별 정답률, 기기·유입 채널

주 사용층은 **모바일**로 예상한다.

---

## 2. 만들어 줄 것 — 세 가지

| # | 무엇 | 파일 |
|---|---|---|
| 1 | Supabase 스키마·표·롤 | `supabase/exam_events.sql` (새 파일) |
| 2 | 수집 API 라우트 | `dashboard/src/app/api/exam-events/route.ts` (새 파일) |
| 3 | 공개 경로 등록 | `dashboard/src/proxy.ts` (한 줄 추가) |

**기존 표·롤·화면·크롤러는 건드리지 않는다.** 1·2는 새 파일이고 3만 한 줄 수정이다.

---

## 3. Supabase — `supabase/exam_events.sql`

### 3-1. `public`이 아니라 **`exam` 스키마**에 만든다

이 요청서에서 가장 중요한 결정이다.

```sql
CREATE SCHEMA IF NOT EXISTS exam;
CREATE TABLE exam.events (...);
```

**이유는 나중에 지우기 위해서다.**

```sql
DROP SCHEMA exam CASCADE;   -- 표·인덱스·정책·제약이 통째로 사라진다
DROP ROLE exam_writer;
```

`public`에 두면 지울 때 표·시퀀스·정책·인덱스를 하나씩 짚어야 하고 빠뜨리면 잔재가
남는다. 스키마로 감싸면 **"이 안은 전부 임시"** 라는 경계가 물리적으로 생긴다.

덤으로 함정 하나를 피한다 — `public`의 새 표에는 `ALTER DEFAULT PRIVILEGES`로
`anon`/`authenticated` 권한이 **자동으로 붙는다** (`book_notes.sql`이 경고한 그것).
별도 스키마에는 그 기본값이 걸리지 않아 애초에 안 생긴다. 그래도 확인 쿼리는 넣어 달라.

### 3-2. 표 — 한 세션이 한 줄

이벤트마다 줄을 쌓지 않고 **세션당 한 줄을 upsert** 한다.

```sql
CREATE TABLE exam.events (
    session_id   TEXT PRIMARY KEY,        -- 브라우저가 만든 난수. 같은 세션은 덮어쓴다
    device       TEXT NOT NULL,           -- 'mobile' | 'pc'
    referrer     TEXT,                    -- 유입 채널 (?from= 값). 없으면 NULL
    started      BOOLEAN NOT NULL DEFAULT false,  -- 표지에서 이름을 썼는가
    furthest     SMALLINT NOT NULL DEFAULT 0,     -- 최고 도달 지점 (아래 정의)
    submitted    BOOLEAN NOT NULL DEFAULT false,
    score        SMALLINT,                -- 0~50. 미제출이면 NULL
    grade        SMALLINT,                -- 1~9.  미제출이면 NULL
    answered     SMALLINT,                -- 푼 문항 수 0~20
    correct      BOOLEAN[],               -- 문항별 정오 20개. 미제출이면 NULL
    exam_no      TEXT,                    -- 수험번호 8자리. 응모 대조용
    clicks       TEXT[] NOT NULL DEFAULT '{}',  -- 'book' | 'share' | 'score_table' | 'wrong_note'
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**`furthest`의 뜻이 기기마다 다르다.**

| device | 값 | 범위 |
|---|---|---|
| `mobile` | **문항 번호** (1문제 1페이지라 문항=페이지) | 0~20 |
| `pc` | **쪽 번호** (0=표지, 1~4=문제지) | 0~4 |

집계할 때 `device`로 갈라서 봐야 한다. 한 칸에 합친 것은 표를 둘로 나눌 만한
일이 아니라서다 — 임시 표이므로 단순함을 택했다.

**한 줄로 모으는 이유**: ① 줄 수가 곧 응시자 수라 세기 쉽다 ② 요청이 늦게 도착해도
순서가 꼬이지 않는다 ③ 나중에 지울 양이 적다.

### 3-3. 제약 — DB를 마지막 그물로

공개 API라 아무 값이나 들어올 수 있다. 라우트에서도 거르지만 DB에도 걸어 달라
(`book_notes.sql`이 "빈 메모를 막는 마지막 그물은 DB에 둔다"고 한 것과 같은 취지).

```sql
CONSTRAINT exam_events_device      CHECK (device IN ('mobile','pc')),
CONSTRAINT exam_events_furthest    CHECK (furthest BETWEEN 0 AND 20),
CONSTRAINT exam_events_score       CHECK (score IS NULL OR score BETWEEN 0 AND 50),
CONSTRAINT exam_events_grade       CHECK (grade IS NULL OR grade BETWEEN 1 AND 9),
CONSTRAINT exam_events_answered    CHECK (answered IS NULL OR answered BETWEEN 0 AND 20),
CONSTRAINT exam_events_correct_len CHECK (correct IS NULL OR array_length(correct,1) = 20),
CONSTRAINT exam_events_exam_no     CHECK (exam_no IS NULL OR exam_no ~ '^[0-9]{8}$'),
CONSTRAINT exam_events_session_id  CHECK (session_id ~ '^[A-Za-z0-9_-]{8,64}$')
```

> 시험지는 **20문항 · 50점 만점**(3점 10 + 2점 10)이고 문항 id는 1~20이다.
> 문항 수가 바뀌면 이 제약도 함께 고쳐야 한다.

### 3-4. 인덱스

조회는 "기간으로 자르고 기기별로 본다" 하나뿐이다.

```sql
CREATE INDEX ON exam.events (created_at DESC);
CREATE INDEX ON exam.events (device, submitted);
```

### 3-5. 롤 — `exam_writer`

`book_notes.sql`의 관례를 그대로 따라 달라.

- `CREATE ROLE exam_writer NOLOGIN NOINHERIT;`
- `GRANT exam_writer TO authenticator;`
- `GRANT USAGE ON SCHEMA exam TO exam_writer;`
- `GRANT SELECT, INSERT, UPDATE ON exam.events TO exam_writer;`
  - **DELETE는 주지 않는다.**
  - SELECT는 upsert 결과 확인용으로만 필요하다.
- **`REVOKE ALL ON SCHEMA exam FROM anon, authenticated;`**
  그리고 표에 대해서도 `REVOKE ALL ... FROM anon, authenticated;`
- **RLS를 켠다** (루트 `AGENTS.md`: "새 테이블을 만들면 RLS를 켤 것")
  - `exam_writer`에게만 `FOR ALL USING (true) WITH CHECK (true)` 정책
- **`dashboard_reader`·`ai_reader`에는 아무것도 주지 않는다.**
  나중에 화면을 만들 땐 그때 `auth.sql`에 GRANT를 더하면 된다.

> **시퀀스 함정은 여기선 안 생긴다.** PK가 `BIGSERIAL`이 아니라 브라우저가 만든
> `session_id`(TEXT)라 시퀀스 자체가 없다. `marketing.sql`·`book_notes.sql`이
> 경고한 `permission denied for sequence`를 걱정하지 않아도 된다.

### 3-6. 확인 쿼리

`book_notes.sql` 말미처럼 주석으로 넣어 달라. 최소 이 넷:

1. `exam_writer`가 닿는 표 목록 — `exam.events` 하나만 나와야 한다
2. `anon`/`authenticated`/`ai_reader`/`dashboard_reader`에 권한이 없는가 — 아무것도 안 나와야 한다
3. RLS가 켜져 있는가
4. PostgREST가 새 스키마를 아는가 — `NOTIFY pgrst, 'reload schema';`

---

## 4. API 라우트 — `dashboard/src/app/api/exam-events/route.ts`

`src/app/api/books/route.ts`를 본보기로 하되, **인증 방식이 다르다.**
books는 `getCurrentUser()`로 로그인을 요구하지만, **이 라우트는 로그인 없이 열려야 한다** —
시험 앱에는 로그인이 없다.

### 4-1. 요청

```
POST /api/exam-events
Content-Type: application/json
```

```jsonc
{
  "session_id": "a1b2c3d4e5f6",   // 필수
  "device": "mobile",             // 필수
  "referrer": "instagram",        // 선택
  "started": true,
  "furthest": 9,
  "submitted": false,
  // 아래는 submitted=true 일 때만
  "score": 34, "grade": 3, "answered": 20,
  "correct": [true, false, ...],  // 20개
  "exam_no": "49771266",
  "clicks": ["book"]
}
```

`sendBeacon`으로 보내면 `Content-Type`이 `text/plain`으로 올 수 있다.
**두 경우 모두 받아 달라** (본문을 텍스트로 읽어 `JSON.parse` 하는 편이 안전하다).

### 4-2. 하는 일

`session_id` 기준 **upsert** 한 번. 그게 전부다.

- 이미 있는 세션이면 갱신한다.
- **`furthest`는 큰 값만 남긴다** — `GREATEST(기존, 새 값)`.
  뒤로 돌아간 것은 이탈 지점이 아니다. 늦게 도착한 요청이 기록을 되돌리면 안 된다.
- `clicks`는 합집합으로 누적한다.
- `started`·`submitted`는 한 번 true면 false로 되돌리지 않는다.
- `updated_at = now()`.

> upsert가 이 규칙대로 되려면 `ON CONFLICT ... DO UPDATE SET furthest = GREATEST(...)`
> 형태의 SQL이 필요하다. Supabase JS의 `.upsert()`로는 GREATEST를 표현하기 어려우니,
> `exam` 스키마에 **RPC 함수 하나**(`exam.record_event(...)`)를 두고 라우트가 그걸
> 호출하는 편이 깔끔하다. 그 함수도 `exam` 스키마 안이라 `DROP SCHEMA CASCADE`로 함께 사라진다.
> 어느 쪽이든 위 규칙만 지켜지면 된다 — 구현은 맡긴다.

### 4-3. 응답

- 성공: `204 No Content` (본문 없음. `sendBeacon`은 응답을 안 읽는다)
- 잘못된 값: `400`
- 서버 오류: `500`

**응답 본문에 데이터를 담지 말 것.** 공개 엔드포인트라 조회 창구가 되면 안 된다.

### 4-4. CORS — 빠뜨리면 전부 실패한다

시험 앱(`gemini-test.easyspub.co.kr`)과 대시보드는 **도메인이 다르다.**
이 저장소에 CORS를 다루는 코드가 아직 없으니 새로 넣어야 한다.

- `Access-Control-Allow-Origin: https://gemini-test.easyspub.co.kr` — **정확히 이 도메인만.**
  `*`로 열지 말 것.
- `OPTIONS` 프리플라이트 처리 (`Access-Control-Allow-Methods: POST`,
  `Access-Control-Allow-Headers: Content-Type`)
- 로컬 개발용으로 `http://localhost:5173`도 허용 목록에 넣어 주면 시험 앱 쪽에서 붙이기 쉽다.
  (환경변수로 갈라도 좋다)

### 4-5. 남용 대비

공개 API라 아무나 아무 값이나 넣을 수 있다. 완벽히 막을 수는 없고 그럴 필요도 없지만
(마케팅 지표다), 최소한 이 정도는:

- 위 3-3의 값 범위를 라우트에서도 확인 → 어긋나면 400
- 본문 크기 상한 (예: 4KB)
- 같은 IP의 분당 요청 제한이 가능하면 좋다. Vercel WAF 설정으로 대신해도 된다.

### 4-6. 개인정보를 담지 않는다

**의도적으로 뺀 것들이다. 추가하지 말아 달라.**

- **서명 이미지** — 손글씨는 필체라 민감하고 지표에 쓸모없다
- **IP 주소** — 저장하지 않는다 (요청 제한에만 쓰고 버린다)
- `session_id`는 난수이고 세션 하나로 끝나 사람을 식별하지 못한다

이 상태를 유지하면 개인정보를 아예 다루지 않게 되어, 처리방침·동의 배너가 필요 없다.

---

## 5. `dashboard/src/proxy.ts` — 한 줄

```diff
-const PUBLIC_PATHS = ["/login", "/auth", "/api/mcp", "/.well-known"];
+const PUBLIC_PATHS = ["/login", "/auth", "/api/mcp", "/api/exam-events", "/.well-known"];
```

**이걸 빠뜨리면 proxy가 로그인 페이지로 307 리다이렉트를 보낸다.**
시험 앱은 쿠키가 없어 전부 실패한다. `/api/mcp`가 같은 이유로 이미 뚫려 있다.

주석에 **임시이며 언제 걷어낼 것인지** 한 줄 남겨 달라.

---

## 6. 용량 — 무료 한도로 충분하다

Vercel Hobby 월 한도는 **함수 호출 100만 회**, 데이터 전송 100GB, Active CPU 4시간이다.

시험 앱은 요청을 아껴 보낸다 (세션당 **1~3회**, 자세한 건 §8):

| 응시자 | 월 호출 | 한도 대비 |
|---|---|---|
| 1,000명 | ~2,500 | 0.3% |
| 10,000명 | ~25,000 | 2.5% |
| 100,000명 | ~250,000 | 25% |

**응시자 10만 명까지 여유롭다.** 한 줄 upsert라 CPU도 문제없다.

> 참고: Vercel Hobby는 약관상 상업적 사용을 금지한다(공정 사용 가이드라인).
> 이 프로젝트는 책 판매 홍보라 여기 해당한다. **이 건은 신경 쓰지 않기로 확인받았으므로**
> 이 요청서에서는 다루지 않는다. 다만 계정이 Hobby라면 알고는 계시는 편이 좋다.

---

## 7. 나중에 걷어내는 절차

**이 절이 이 요청서의 존재 이유다.** 작업하면서 이 순서가 성립하는지 확인해 달라.

| 순서 | 하는 일 |
|---|---|
| 1 | `dashboard/src/app/api/exam-events/route.ts` 삭제 → 커밋 (Vercel 자동 배포) |
| 2 | `dashboard/src/proxy.ts`의 `PUBLIC_PATHS`에서 `/api/exam-events` 제거 |
| 3 | Supabase에서 `DROP SCHEMA exam CASCADE; DROP ROLE exam_writer;` |
| 4 | `supabase/exam_events.sql` 삭제 |
| 5 | 시험 앱에서 `src/analytics.ts`와 호출부 제거 (그쪽 저장소 작업) |

**기존 표·롤·화면·크롤러는 하나도 건드리지 않았으므로 뗄 때 깨질 곳이 없다.**
이 조건을 깨는 구현(예: `auth.sql` 수정, 기존 표에 컬럼 추가)은 하지 말아 달라.

### 문서에 남길 것

루트 `AGENTS.md`에 **임시라는 사실과 제거 절차**를 짧게 적어 달라.
안 적으면 몇 달 뒤 이게 왜 있는지 아무도 모르게 된다 — 정리 계획이 사라지는 가장 흔한 경로다.

---

## 8. 참고 — 시험 앱(`gemini-test`) 쪽에서 할 일

**이 요청서의 범위 밖이다.** 받는 쪽 이해를 돕기 위한 설명이며, 별도로 작업한다.

- `src/analytics.ts` 파일 하나에 몰아 둔다 (뗄 때 파일 하나 + 호출부 몇 줄)
- `session_id`는 `crypto.randomUUID()`로 만들어 `sessionStorage`에 둔다
- 진행 상황은 **매번 보내지 않고 브라우저에 쌓아 둔다**
- `visibilitychange`(탭이 가려질 때)에 `navigator.sendBeacon`으로 **한 번** 보낸다
  — 모바일에서 가장 믿을 만한 신호다. `fetch`는 탭이 닫히면 취소된다
- 제출 시점에는 즉시 한 번 더 보낸다 (가장 중요한 기록이라 유실을 피한다)
- 기기 판정은 `(max-width: 767px)` — 시험 앱이 모바일/PC를 가르는 기준과 같다

### 알려진 한계 (받는 쪽도 알고 있어야 한다)

- **브라우저가 강제 종료되면 그 세션은 통째로 유실된다.** 매번 보내는 방식보다
  유실이 조금 는다. 제출 기록은 별도로 즉시 보내므로 안전하다.
- **iOS 사파리는 `sendBeacon`을 못 보내는 경우가 있다.** 모바일 이탈 지점이
  PC보다 덜 정확하다.
- **"방문 수"는 실제보다 적게 나온다.** JS 실행 기준이라 로딩 중 이탈은 안 잡힌다.
  이 숫자를 대외적으로 "접속자 수"라 부를 때는 보수적인 값임을 감안해야 한다.
- `session_id`를 브라우저가 만들므로 **위조가 가능하다.** 가짜 줄을 넣을 수 있다.
  마케팅 지표라 감수하되, §4-5의 값 검증은 넣어 달라.

---

## 9. 완료 확인 — 이 쿼리들이 답을 주면 된다

```sql
-- 1) 시험지를 띄우고 바로 이탈 (이름도 안 씀)
SELECT count(*) FROM exam.events WHERE NOT started;

-- 2) 모바일 이탈 지점 — 몇 번 문항에서 그만뒀나
SELECT furthest, count(*) FROM exam.events
WHERE device = 'mobile' AND NOT submitted
GROUP BY furthest ORDER BY furthest;

-- 3) PC 이탈 지점 — 몇 쪽에서
SELECT furthest, count(*) FROM exam.events
WHERE device = 'pc' AND NOT submitted
GROUP BY furthest ORDER BY furthest;

-- 4) 완주율 (기기별)
SELECT device,
       count(*) AS 방문,
       count(*) FILTER (WHERE started)   AS 시작,
       count(*) FILTER (WHERE submitted) AS 제출,
       round(100.0 * count(*) FILTER (WHERE submitted) / nullif(count(*),0), 1) AS 완주율
FROM exam.events GROUP BY device;

-- 5) 점수 분포 (나중에 grade.ts의 가정 분포를 실제 값으로 교체할 재료)
SELECT avg(score), stddev(score), count(*) FROM exam.events WHERE submitted;

-- 6) 문항별 정답률
SELECT i AS 문항, round(100.0 * count(*) FILTER (WHERE correct[i]) / count(*), 1) AS 정답률
FROM exam.events, generate_series(1,20) AS i
WHERE submitted GROUP BY i ORDER BY i;

-- 7) 클릭 (책·공유)
SELECT unnest(clicks) AS 클릭, count(*) FROM exam.events GROUP BY 1;
```

---

## 10. 정리

- 새 파일 **둘**, 기존 파일 수정 **한 줄**
- 기존 표·롤·화면·크롤러 **무수정**
- 지울 때 **`DROP SCHEMA exam CASCADE` 한 줄 + 파일 삭제**
- 화면은 만들지 않는다 (필요해지면 그때 `auth.sql`에 GRANT 한 줄)

궁금한 점이나 이 설계가 이 저장소의 관례와 어긋나는 곳이 있으면 알려 달라.
특히 §3-1(별도 스키마)은 이 저장소에 전례가 없는 방식이라, 더 나은 길이 있으면 그쪽을 따르겠다.
