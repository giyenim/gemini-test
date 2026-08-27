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

# 최종 검판용 PDF는 인쇄 쪽 p 가 PDF 1-기준 쪽 p+2 에 있다 (앞에 표지·면지 2쪽).
SOURCES = [
    {
        "pdf": "된다! 제미나이 활용법_내지(260811) - 검판용.pdf",
        "part": "첫째마당 구글 제미나이 가볍게 시작하기",
        "chapters": [
            {"no": "00", "title": "첫째마당 여는 글", "pdf_range": (20, 21), "pages": "18-19",
             "file": "00-첫째마당.md"},
            {"no": "01", "title": "안녕, 제미나이!", "pdf_range": (22, 52), "pages": "20-50",
             "file": "01-안녕-제미나이.md"},
            {"no": "02", "title": "제미나이는 특히 무엇을 잘할까?", "pdf_range": (53, 97), "pages": "51-95",
             "file": "02-제미나이는-특히-무엇을-잘할까.md"},
        ],
    },
    {
        "pdf": "된다! 제미나이 활용법_내지(260811) - 검판용.pdf",
        "part": "둘째마당 업무와 일상에서 제대로 활용하기",
        "chapters": [
            {"no": "00", "title": "둘째마당 여는 글", "pdf_range": (98, 99), "pages": "96-97",
             "file": "00-둘째마당.md"},
            {"no": "03", "title": "회사 칼퇴를 부르는 제미나이 활용법", "pdf_range": (100, 143), "pages": "98-141",
             "file": "03-회사-칼퇴를-부르는-제미나이-활용법.md"},
            {"no": "04", "title": "SNS 시장에서 살아남는 콘텐츠 만들기", "pdf_range": (144, 180), "pages": "142-178",
             "file": "04-sns-시장에서-살아남는-콘텐츠-만들기.md"},
            {"no": "05", "title": "일상생활에서 제미나이 도움받기", "pdf_range": (181, 216), "pages": "179-214",
             "file": "05-일상생활에서-제미나이-도움받기.md"},
            {"no": "06", "title": "내 손안의 백과사전! 스마트폰에서 제미나이 활용하기", "pdf_range": (217, 235), "pages": "215-233",
             "file": "06-스마트폰에서-제미나이-활용하기.md"},
            {"no": "07", "title": "구글 AI 생태계 완성! — 제미나이 노트북 & 구글 AI 스튜디오 & 오팔", "pdf_range": (236, 271), "pages": "234-269",
             "file": "07-제미나이-노트북-구글-ai-스튜디오-오팔.md"},
        ],
    },
]

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for src in SOURCES:
        print(src["pdf"])
        convert(ROOT / src["pdf"], src["chapters"], OUT, src["part"])
