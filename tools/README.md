# tools

원본 교재 PDF를 `book/`의 장별 Markdown으로 변환하는 스크립트.

```bash
python -m pip install pymupdf
python tools/build_book_md.py
```

| 파일 | 역할 |
|------|------|
| `book2md.py` | 변환 엔진. 폰트·크기 → 위계 매핑, 문단 이어붙이기, 표 복원, 그림 캡션·말풍선 분류 |
| `build_book_md.py` | PDF와 장 범위 정의. 장이 추가되면 여기 `SOURCES`만 수정 |

위계는 원서 조판 스타일로 판별한다 (예: `SDPsyche-Upright 35pt` = 장 제목, `NanumSquareNeoTTF-cBd 11.5pt` = 소제목).
전체 매핑표는 `book2md.py` 상단 독스트링에 있다. 출력 표기 규칙은 [`book/README.md`](../book/README.md) 참고.
