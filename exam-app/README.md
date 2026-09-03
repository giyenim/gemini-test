# exam-app

수능형 시험지 UI. React 19 + Vite + Tailwind 4 + Noto Serif KR.

임의의 지문·문제 JSON을 넣으면 레이아웃이 자동으로 잡힌다.  
- **데스크톱**: 2단 페이지 패킹 — [`LAYOUT.md`](./LAYOUT.md)  
- **모바일**(≤767px): 가로 스와이프 페이지 — 지문 묶음 / 단일 문제 (`LAYOUT.md` 모바일 규칙)  

저장소 에이전트 안내는 [`../AGENTS.md`](../AGENTS.md).

## 실행

```bash
npm install
npm run dev      # http://localhost:5173/  (UI 킷 작업장은 /?ui)
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
| `src/ui/` | 시험지 밖 화면 UI 킷 (손그림 버튼·서명 창) — [`src/ui/README.md`](./src/ui/README.md) |
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

## 공유 미리보기 — `public/og.png`

카카오톡·스레드·X 가 링크를 펼칠 때 보여 주는 1200×630 그림이다. 따로 그린 것이 아니라
**표지(`CoverSheet`)의 위쪽을 그대로 잘라낸 것**이다 — 시험지가 곧 광고물이라 따로 만들 이유가 없고,
문항이나 시험명이 바뀌면 다시 자르기만 하면 된다.

다시 자르는 법 (브라우저 자동화 도구 기준):

1. `npm run dev` 로 앱을 띄우고 뷰포트를 **1200×630** 으로 맞춘다
2. 표지가 뜬 상태에서 표지 요소를 OG 폭에 맞춰 확대하고 왼쪽 위에 붙인다

   ```js
   const c = document.querySelector('[data-cover]')
   Object.assign(c.style, {
     position: 'fixed', left: '0', top: '0',
     transformOrigin: 'top left', transform: `scale(${1200 / 842})`, zIndex: '9999',
   })
   document.body.style.backgroundImage = 'none'   // 모눈종이 책상과 표지 벽지를 지운다
   await document.fonts.ready                      // 조선굴림이 붙기 전에 찍지 않는다
   ```

   `842` 는 `layout/constants.ts` 의 `PAGE_W` 다. 배율은 여기서 따라오므로 손으로 적지 않는다.
3. 뷰포트를 그대로 찍어 `public/og.png` 로 저장한다. **`fullPage` 로 찍지 않는다** — 뷰포트가 곧 규격이다

이 배율이면 잘리는 자리가 성명·수험 번호 줄 아래, 유의 사항 상자 바로 앞이다. 표지 배치를
손보면 잘리는 자리도 함께 움직이므로 다시 확인한다.

> 그림을 갈아 끼우면 `index.html` 의 `og:image` 에 붙은 `?v=` 를 올린다. 카카오·메타는 URL 단위로
> 캐시해서 같은 주소로 덮으면 옛 그림이 한참 남는다.

## 탭 아이콘 — `public/favicon.ico`

브라우저 탭에 뜨는 그림이다. **책 표지의 「된다!」 로고를 잘라낸 것**이다 — 표지를
통째로 줄이면 32px 에서 글자가 뭉개져 색 덩어리만 남는다. 파비콘이 감당하는 것은
글자 두어 자가 한계다.

다시 굽는 법 (저장소 루트에서, Pillow 필요):

```python
from PIL import Image
im = Image.open('된다! 제미나이 활용법_앞표지.jpg').convert('RGB')
W, H = im.size

# 표지에서 「된다!」 로고 자리 — 표지 배치가 바뀌면 이 비율도 다시 잡는다
c = im.crop((int(W*0.02), int(H*0.36), int(W*0.30), int(H*0.49)))

# 글자의 **진짜** 경계를 임계값으로 찾는다. `getbbox()` 를 그냥 쓰면 느낌표 오른쪽의
# 흐린 픽셀까지 글자로 세어 경계가 65px 넓게 잡히고, 그만큼 글자가 왼쪽으로 쏠린다.
bw = c.convert('L').point(lambda v: 255 if v < 200 else 0)
glyph = c.crop(bw.getbbox())
gw, gh = glyph.size

pad = 0.03
side = int(round(max(gw, gh) * (1 + pad*2)))
canvas = Image.new('RGB', (side, side), (255, 255, 255))
canvas.paste(glyph, ((side-gw)//2, (side-gh)//2))

out = 'exam-app/public'
canvas.save(out+'/favicon.ico', sizes=[(16,16), (32,32), (48,48)])
canvas.resize((180,180), Image.LANCZOS).save(out+'/apple-touch-icon.png')
canvas.resize((192,192), Image.LANCZOS).save(out+'/favicon-192.png')
```

`.ico` 안에 16·32·48 을 함께 담는다 — 브라우저와 OS 가 자리에 맞는 크기를 고른다.

「된다!」 는 가로가 세로의 2 배가 넘어(457×220) 정사각형에 넣으면 **위아래 여백이
좌우보다 넓다** — 글자를 더 키우려 해도 가로가 먼저 꽉 찬다. 가운데 정렬이 맞았는지는
좌우 여백이 같은지로 확인한다:

```python
chk = Image.open(out+'/favicon-192.png').convert('L').point(lambda v: 255 if v<200 else 0).getbbox()
print('좌%d 우%d 상%d 하%d' % (chk[0], 192-chk[2], chk[1], 192-chk[3]))
```

> 그림을 갈아 끼우면 `index.html` 의 `?v=` 를 올린다. **파비콘은 og 그림보다도 캐시가
> 질기다** — 주소가 같으면 브라우저가 옛 그림을 한참 붙들고 있다.
