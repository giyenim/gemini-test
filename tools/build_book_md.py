"""원본 PDF → book/*.md 생성.

사용법:
    python -m pip install pymupdf
    python tools/build_book_md.py            # 기본: 저장소 book/ 에 출력
    python tools/build_book_md.py <출력경로>

장이 추가되면 CHAPTERS에 항목만 더한다 (pdf_range 는 PDF 안에서의 쪽 번호, pages 는 책에 인쇄된 쪽).
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from book2md import convert  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "book"

SOURCES = [
    {
        "pdf": "01_01~02(18~85).pdf",
        "part": "첫째마당 구글 제미나이 가볍게 시작하기",
        "chapters": [
            {"no": "00", "title": "첫째마당 여는 글", "pdf_range": (1, 2), "pages": "18-19",
             "file": "00-첫째마당.md"},
            {"no": "01", "title": "안녕, 제미나이!", "pdf_range": (3, 33), "pages": "20-50",
             "file": "01-안녕-제미나이.md"},
            {"no": "02", "title": "제미나이는 특히 무엇을 잘할까?", "pdf_range": (34, 68), "pages": "51-85",
             "file": "02-제미나이는-특히-무엇을-잘할까.md"},
        ],
    },
    {
        "pdf": "02_03~04(86~168).pdf",
        "part": "둘째마당 업무와 일상에서 제대로 활용하기",
        "chapters": [
            {"no": "00", "title": "둘째마당 여는 글", "pdf_range": (1, 2), "pages": "86-87",
             "file": "00-둘째마당.md"},
            {"no": "03", "title": "회사 칼퇴를 부르는 제미나이 활용법", "pdf_range": (3, 46), "pages": "88-131",
             "file": "03-회사-칼퇴를-부르는-제미나이-활용법.md"},
            {"no": "04", "title": "SNS 시장에서 살아남는 콘텐츠 만들기", "pdf_range": (47, 83), "pages": "132-168",
             "file": "04-sns-시장에서-살아남는-콘텐츠-만들기.md"},
        ],
    },
]

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for src in SOURCES:
        print(src["pdf"])
        convert(ROOT / src["pdf"], src["chapters"], OUT, src["part"])
