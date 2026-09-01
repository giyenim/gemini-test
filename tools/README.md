# tools

| 파일 | 역할 |
|------|------|
| `book2md.py` | 교재 PDF 변환 엔진. 폰트·크기 → 위계 매핑, 문단 이어붙이기, 표 복원, 그림 캡션·말풍선 분류 |
| `build_book_md.py` | PDF와 장 범위 정의. 장이 추가되면 여기 `SOURCES`만 수정 |
| `make_talk_figure.py` | 학생 대화형 문항 그림 생성. 원본 일러스트에 말풍선·A·B·C 라벨을 얹는다 |
| `make_desk_wallpaper.py` | 시험지 바깥 책상에 깔 표지 벽지 타일 생성 |

## 교재 PDF → `book/*.md`

```bash
python -m pip install pymupdf
python tools/build_book_md.py
```

위계는 원서 조판 스타일로 판별한다 (예: `SDPsyche-Upright 35pt` = 장 제목, `NanumSquareNeoTTF-cBd 11.5pt` = 소제목).
전체 매핑표는 `book2md.py` 상단 독스트링에 있다. 출력 표기 규칙은 [`book/README.md`](../book/README.md) 참고.

## 학생 대화 그림 → `exam-app/public/figures/*.webp`

```bash
python -m pip install pillow
python tools/make_talk_figure.py                  # FIGURES 전부 다시 생성
python tools/make_talk_figure.py q01-talk         # 하나만
python tools/make_talk_figure.py --probe 원본.png  # 좌표 잡기용 잉크 분포
```

대사가 그림 안에 구워져 있으므로 **대사를 고치려면 `FIGURES`를 고쳐 그림을 다시 만든다.**
JSON에는 대화 텍스트 블록이 없다.

원본 일러스트(`preview.png` 등)는 저장소에 없다(`.gitignore`). 결과물만 커밋한다.
새 그림을 추가할 때는 `--probe`로 잉크 분포를 찍어 머리 위치(`head_top`, `tip_x`)와
라벨 놓을 빈 곳(`label_pos`)을 눈으로 고른 뒤 `FIGURES`에 항목을 더한다.

## 책상 벽지 → `exam-app/public/desk-wallpaper.webp`

```bash
python -m pip install pillow
python tools/make_desk_wallpaper.py             # 기본값대로 굽기
python tools/make_desk_wallpaper.py --alpha 0.3 # 진하기만 바꿔 굽기
```

시험지 바깥 책상에 교재 표지를 벽지처럼 깐다. 표지 두 권을 대각으로 놓은 **이음매 없는**
타일 한 장이며, 타일 밖으로 나간 부분을 반대쪽에도 붙여 이어 붙여도 경계가 보이지 않는다.

**무늬는 스크립트 위쪽 네 상수로만 조절한다. CSS 는 손댈 곳이 없다.**
`background-image` 에는 opacity 가 없어 연하기는 타일에 구워 넣고, 크기도 타일의 실제
픽셀 크기를 그대로 쓴다 (`index.css` 는 `background-size: auto`).

| 상수 | 뜻 |
|------|-----|
| `COVER_W` | 책 한 권의 가로 — 줄이면 책만 작아진다. 제목까지 읽히게 하려면 90 이상 |
| `TILE_W` / `TILE_H` | 책 사이 간격 — 키우면 책은 그대로 두고 사이만 벌어진다 (모눈 20px 의 배수) |
| `ALPHA` | 진하기 |
| `TILT` | 기울기(도) — 두 권 모두 같은 쪽으로 눕힌다 |

지금 값은 스크립트 위쪽에서 본다 — 여기 베껴 두지 않는다. 조절할 때마다 낡는다.

고친 뒤 다시 돌리고 브라우저를 새로고침하면 바로 보인다.
붙는 자리는 `exam-app/src/index.css` 의 `--desk-wallpaper` 다 (`LAYOUT.md` 배경 절).

표지 원본(`된다! 제미나이 활용법_개정_표지_입체_1.png`)은 저장소에 없다(`.gitignore`).
뒷배경과 그림자가 알파로 빠져 있는 **입체 표지**를 써야 책이 책상에 놓인 것처럼 보인다.
