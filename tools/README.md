# tools

| 파일 | 역할 |
|------|------|
| `book2md.py` | 교재 PDF 변환 엔진. 폰트·크기 → 위계 매핑, 문단 이어붙이기, 표 복원, 그림 캡션·말풍선 분류 |
| `build_book_md.py` | PDF와 장 범위 정의. 장이 추가되면 여기 `SOURCES`만 수정 |
| `make_talk_figure.py` | 학생 대화형 문항 그림 생성. 원본 일러스트에 말풍선·A·B·C 라벨을 얹는다 |

## 교재 PDF → `book/*.md`

```bash
python -m pip install pymupdf
python tools/build_book_md.py
```

위계는 원서 조판 스타일로 판별한다 (예: `SDPsyche-Upright 35pt` = 장 제목, `NanumSquareNeoTTF-cBd 11.5pt` = 소제목).
전체 매핑표는 `book2md.py` 상단 독스트링에 있다. 출력 표기 규칙은 [`book/README.md`](../book/README.md) 참고.

## 학생 대화 그림 → `exam-app/public/figures/*.png`

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
