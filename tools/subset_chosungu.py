"""조선굴림 서브셋 — 실제로 쓰는 글자만 남긴 웹폰트를 만든다.

CDN 의 원본(`ChosunGu.woff2`)은 한글 전체를 담은 통짜 한 벌이라 1,441KB 다.
이 한 파일이 페이지 글꼴 전송량의 96% 를 차지했다 (Noto Serif KR 은 Google Fonts 가
유니코드 서브셋으로 쪼개 줘서 68KB 였다). 여기서 쓰는 글자만 남기면 67KB 로 떨어진다.

결과물은 `exam-app/public/fonts/ChosunGu-subset.woff2` 이고 저장소에 커밋한다.
조선굴림은 방일영문화재단이 개인·기업 무료로 배포하며 재배포·임베딩을 허용한다.

사용법:
    python -m pip install fonttools brotli
    python tools/subset_chosungu.py

**글자를 새로 쓰기 시작하면 이 스크립트를 다시 돌린다.** 서브셋에 없는 글자는
폴백(Gulim)으로 떨어져 그 글자만 모양이 달라진다.

`index.css` 의 @font-face 와 `components/result/fontEmbed.ts` 가 **같은 파일**을
가리켜야 한다. fontEmbed 는 성적표를 PNG 로 구울 때 이 파일을 base64 로 박는다.
"""
import io
import json
import os
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT / "exam-app"
SRC = APP / "src"
OUT = APP / "public" / "fonts" / "ChosunGu-subset.woff2"

SOURCE_URL = "https://cdn.jsdelivr.net/gh/fonts-archive/ChosunGu/ChosunGu.woff2"

# 날짜·점수 표기는 코드가 조립해 내므로 문자열 검색으로는 잡히지 않는다 (examinee.ts, grade.ts)
# 문장 부호도 여기서만 챙긴다 — `collect_chars` 의 정규식은 한글·숫자만 걷으므로
# 겹낫표(《》) 같은 글자는 소스에 있어도 잡히지 않는다.
ALWAYS = (
    "0123456789"
    ".,·:;()[]{}<>/\\-—–~!?%&*+=`^_|@#$'\" "
    "《》〈〉「」『』"
    "↗›"
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    "년월일점등급백분위표준원영역만제교시성명수험번호비고"
)


def collect_chars() -> set[str]:
    """소스의 한글·숫자를 모두 걷는다.

    조선굴림이 닿는 곳만 골라내려 하지 않는다 — 놓치면 그 글자만 폴백으로 떨어져
    조판이 어긋나는데, 넉넉히 넣어도 한글 500자 남짓이라 결과가 거의 커지지 않는다.
    """
    chars: set[str] = set(ALWAYS)
    for path in SRC.rglob("*"):
        if path.suffix in (".ts", ".tsx"):
            chars |= set(re.findall(r"[가-힣0-9]", path.read_text(encoding="utf-8")))
    meta = json.loads((SRC / "data" / "exam-sample.json").read_text(encoding="utf-8"))["meta"]
    for value in meta.values():
        chars |= set(str(value))
    return chars


def main() -> None:
    chars = collect_chars()
    hangul = len([c for c in chars if "가" <= c <= "힣"])
    print(f"글자 {len(chars)}자 (한글 {hangul}자)")

    tmp_font = OUT.parent / "_ChosunGu-source.woff2"
    tmp_text = OUT.parent / "_chars.txt"
    OUT.parent.mkdir(parents=True, exist_ok=True)
    try:
        print(f"내려받는 중: {SOURCE_URL}")
        urllib.request.urlretrieve(SOURCE_URL, tmp_font)
        before = tmp_font.stat().st_size
        tmp_text.write_text("".join(sorted(chars)), encoding="utf-8")

        subprocess.run(
            [
                sys.executable, "-m", "fontTools.subset", str(tmp_font),
                f"--text-file={tmp_text}",
                f"--output-file={OUT}",
                "--flavor=woff2",
                "--layout-features=*",
            ],
            check=True,
        )
        after = OUT.stat().st_size
        print(
            f"{OUT.relative_to(ROOT)}  "
            f"{before / 1024:.1f}KB -> {after / 1024:.1f}KB "
            f"({100 - after / before * 100:.1f}% 감소)"
        )
    finally:
        for leftover in (tmp_font, tmp_text):
            if leftover.exists():
                os.remove(leftover)


if __name__ == "__main__":
    main()
