"""책상 벽지 타일 생성 — 시험지 바깥 바탕에 깔리는 책 표지 무늬.

시험지 밖은 원래 모눈종이만 깐 흰 책상이었다. 책 표지를 노출할 자리가
성적표의 "책 보러가기" 링크뿐이라, 응시하는 내내 눈에 닿도록 바깥 바탕을
표지로 도배한다. 표지 자체를 CSS 로 흐리게 만들 수는 없으니
(`background-image` 에는 opacity 가 없다) **여기서 알파를 미리 구워** 넣는다.

만드는 것은 **이음매 없는 타일 한 장**이다. 표지 두 권을 타일의 마주 보는
사분면에 반 칸씩 어긋나게 놓아 대각 격자를 만들고, 타일 경계를 넘어가는
부분은 상하좌우로 감아 붙여(wrap) 이어 붙여도 티가 나지 않게 한다.

원본 표지(`된다! 제미나이 활용법_개정_표지_입체_1.png`)는 뒷배경이 투명하고
그림자까지 알파에 들어 있어 그대로 얹으면 책이 책상에 놓인 것처럼 보인다.
원본은 저장소에 없다(.gitignore) — 결과물만 커밋한다.

타일의 실제 픽셀 크기가 곧 화면에 깔리는 크기다 (`index.css` 는 `background-size: auto`).
**여기 값만 고쳐 다시 구우면 CSS 는 손댈 곳이 없다.**

사용법:
    python -m pip install pillow
    python tools/make_desk_wallpaper.py
    python tools/make_desk_wallpaper.py --alpha 0.3    # 진하기만 바꿔 다시 굽기
"""
import argparse
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "된다! 제미나이 활용법_개정_표지_입체_1.png"
OUT = ROOT / "exam-app" / "public" / "desk-wallpaper.webp"

# ─── 손볼 곳은 아래 네 값이 전부다. 고치고 스크립트를 다시 돌리면 끝이다 ───

# 책 크기 (표지 한 권의 가로 px). 줄이면 책만 작아진다.
# 제목("제미나이 활용법")이 읽히는 하한이 90 쯤 — 더 줄이면 알아볼 수 없는 색 얼룩이 되어
# 표지를 깐 뜻이 없어진다.
COVER_W = 50

# 책 사이 간격 (타일 한 변). **키우면 책은 그대로 두고 사이만 벌어진다.**
# 책상 모눈(20px)의 정수 배로 잡아야 무늬와 모눈이 어긋나지 않는다.
# 한 타일에 두 권이 대각으로 들어가므로 COVER_W 의 두 배보다는 커야 겹치지 않는다.
TILE_W, TILE_H = 180, 360

# 진하기. 모눈이 잉크 5% 이니 그보다는 진해야 보인다. --alpha 로도 덮어쓸 수 있다.
ALPHA = 0.6

# 기울기(도). 반듯이 세우면 인쇄된 무늬 같고, 조금 기울이면 책상에 놓인 것처럼 보인다.
# 두 권을 서로 반대로 기울이면 흩어 놓은 꼴이 되므로 한 값으로 같은 쪽으로만 눕힌다.
TILT = 5

# ──────────────────────────────────────────────────────────

WEBP_QUALITY = 92


def make_tile(alpha: float) -> Image.Image:
    cover = Image.open(SOURCE).convert("RGBA")
    cover = cover.crop(cover.split()[-1].getbbox())  # 원본 여백 잘라내기
    height = round(COVER_W * cover.height / cover.width)
    cover = cover.resize((COVER_W, height), Image.LANCZOS)

    book = cover.rotate(TILT, Image.BICUBIC, expand=True)

    tile = Image.new("RGBA", (TILE_W, TILE_H), (0, 0, 0, 0))
    # 두 권을 대각으로 — 각 사분면 한가운데에 하나씩
    for cx, cy in ((TILE_W // 4, TILE_H // 4), (TILE_W * 3 // 4, TILE_H * 3 // 4)):
        x, y = cx - book.width // 2, cy - book.height // 2
        # 타일 밖으로 나간 만큼을 반대쪽에도 붙인다 — 이래야 이음매가 안 생긴다.
        # paste 는 알파를 덮어써 겹치는 자리를 파먹으므로 한 장씩 합성한다.
        for dx in (-TILE_W, 0, TILE_W):
            for dy in (-TILE_H, 0, TILE_H):
                layer = Image.new("RGBA", tile.size, (0, 0, 0, 0))
                layer.paste(book, (x + dx, y + dy))
                tile = Image.alpha_composite(tile, layer)

    faded = tile.split()[-1].point(lambda a: round(a * alpha))
    tile.putalpha(faded)
    return tile


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--alpha", type=float, default=ALPHA,
                        help=f"표지 진하기 0~1 (기본 {ALPHA})")
    args = parser.parse_args()

    if not SOURCE.exists():
        raise SystemExit(f"표지 원본이 없다: {SOURCE}")

    tile = make_tile(args.alpha)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    tile.save(OUT, "WEBP", quality=WEBP_QUALITY, lossless=False, exact=True)
    print(f"{OUT.relative_to(ROOT)}  타일 {TILE_W}×{TILE_H}  책 {COVER_W}px  "
          f"진하기 {args.alpha}  {OUT.stat().st_size / 1024:.1f}KB")
    # cp949 콘솔에서 깨지는 글자(— 등)는 쓰지 않는다
    print("CSS 는 background-size: auto 라 고칠 곳이 없다. 새로고침하면 바로 보인다.")


if __name__ == "__main__":
    main()
