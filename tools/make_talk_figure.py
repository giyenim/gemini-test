"""학생 대화 그림 생성 — 원본 일러스트에 말풍선과 A·B·C 라벨을 얹는다.

수능 과학탐구의 '학생 대화형' 문항은 대사가 그림 안에 있어야 발문("그림은 …
학생 A, B, C가 나눈 대화이다")과 맞는다. 그래서 대사를 JSON 의 `general` 블록에
두지 않고 이 스크립트로 그림에 구워 넣는다. **대사를 고치려면 여기 FIGURES 를
고쳐 그림을 다시 만들어야 한다.**

사용법:
    python -m pip install pillow
    python tools/make_talk_figure.py                 # FIGURES 전부 생성
    python tools/make_talk_figure.py q01-talk        # 하나만
    python tools/make_talk_figure.py --probe 원본.png # 좌표 잡기용 잉크 분포 출력

새 대화 그림을 추가하려면 FIGURES 에 항목만 더한다. 학생 좌표는 원본마다 다르니
--probe 로 잉크 분포를 찍어 머리 위치와 빈 곳을 눈으로 고른다.

원본 일러스트(`preview.png` 등)는 저장소에 없다(.gitignore). 결과물만
exam-app/public/figures/ 에 커밋한다.
"""
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "exam-app" / "public" / "figures"
FONT_PATH = r"C:\Windows\Fonts\NotoSerifKR-VF.ttf"  # 시험지 본문과 같은 서체

# 각 학생: slot=말풍선 가로 범위, tip_x=꼬리가 가리킬 x, head_top=머리 위쪽 y,
# label=A·B·C, label_pos=라벨 중심(머리 왼쪽). 모두 원본 이미지 좌표.
FIGURES = {
    "q01-talk": {
        "src": "preview.png",
        "crop": (0, 0, 1672, 830),  # 아래쪽 빈 여백 잘라내기
        "students": [
            dict(label="A", slot=(15, 545), tip_x=260, head_top=267, label_pos=(116, 352),
                 text="동영상 생성은 무료로도 제한 없이 쓸 수 있어."),
            dict(label="B", slot=(571, 1101), tip_x=980, head_top=248, label_pos=(818, 344),
                 text="세로 화면으로 만들려면 16:9를 골라야 해."),
            dict(label="C", slot=(1127, 1657), tip_x=1440, head_top=293, label_pos=(1310, 378),
                 text="완성된 영상에는 제미나이 워터마크가 붙어."),
        ],
    },
}

# --- 그리기 상수 ---------------------------------------------------------
LINE = (60, 60, 60)      # 삽화 선 색에 맞춘 말풍선 테두리
INK = (25, 25, 25)       # 글자 색
STROKE = 3
FS_TEXT, LINE_H = 52, 70     # 말풍선 글자 크기 / 줄간격
FS_LABEL = 62                # A·B·C 라벨
PAD_X, PAD_Y = 30, 30        # 말풍선 안쪽 여백
RADIUS = 28
TAIL_H, TAIL_W = 34, 26      # 꼬리 높이 / 밑변 절반
HEAD_GAP = 14                # 꼬리 끝과 머리 사이
TOP_MARGIN = 24              # 말풍선 위 최소 여백

# 글자 크기는 시험지에 실릴 크기에 맞춰 정했다. 단 너비 307px 에 그림이 꽉 차므로
# 52px 는 화면에서 약 9.5px — 본문(11.5px)보다 조금 작은 정도로 읽힌다.


def _font(size, weight):
    f = ImageFont.truetype(FONT_PATH, size)
    try:
        f.set_variation_by_axes([weight])   # 가변 폰트 굵기
    except Exception:
        pass
    return f


_probe_draw = ImageDraw.Draw(Image.new("RGB", (1, 1)))


def _width(s, font):
    return _probe_draw.textlength(s, font=font)


def wrap(text, font, max_w):
    """어절 단위로 줄바꿈. 한 어절이 너무 길면 글자 단위로 쪼갠다."""
    lines, cur = [], ""
    for word in text.split(" "):
        cand = word if not cur else f"{cur} {word}"
        if _width(cand, font) <= max_w:
            cur = cand
            continue
        if cur:
            lines.append(cur)
        if _width(word, font) <= max_w:
            cur = word
            continue
        cur = ""
        for ch in word:
            if _width(cur + ch, font) <= max_w:
                cur += ch
            else:
                lines.append(cur)
                cur = ch
    if cur:
        lines.append(cur)
    return lines


def _rounded_points(x0, y0, x1, y1, r, seg=8):
    """둥근 사각형 둘레를 시계 방향 점 목록으로."""
    pts = []
    for cx, cy, a0 in ((x1 - r, y0 + r, -90), (x1 - r, y1 - r, 0),
                       (x0 + r, y1 - r, 90), (x0 + r, y0 + r, 180)):
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def bubble_polygon(x0, y0, x1, y1, tip_x, tip_y):
    """둥근 사각형 + 꼬리를 폴리곤 하나로 만든다.

    따로 그리면 테두리가 꼬리 밑변을 가로질러 지저분해지므로, 아래 변을 지나는
    중에 꼬리 세 점을 끼워 넣어 한 번에 그린다.
    """
    pts = _rounded_points(x0, y0, x1, y1, RADIUS)
    out, done = [], False
    for i, p in enumerate(pts):
        out.append(p)
        nxt = pts[(i + 1) % len(pts)]
        # 아래 변은 오른쪽 → 왼쪽으로 진행한다
        on_bottom = abs(p[1] - y1) < 0.5 and abs(nxt[1] - y1) < 0.5 and nxt[0] < p[0]
        if on_bottom and not done and nxt[0] <= tip_x - TAIL_W <= tip_x + TAIL_W <= p[0]:
            out += [(tip_x + TAIL_W, y1), (tip_x, tip_y), (tip_x - TAIL_W, y1)]
            done = True
    if not done:
        raise SystemExit(f"꼬리를 넣을 자리가 없다 (tip_x={tip_x}). slot 을 넓혀라.")
    return out


def build(name, spec):
    src_path = ROOT / spec["src"]
    if not src_path.exists():
        raise SystemExit(
            f"원본이 없다: {src_path}\n"
            "원본 일러스트는 저장소에 없다(.gitignore). 저장소 루트에 두고 다시 실행한다."
        )

    font_text = _font(FS_TEXT, 400)
    font_label = _font(FS_LABEL, 700)

    students = [dict(s) for s in spec["students"]]
    for s in students:
        x0, x1 = s["slot"]
        s["lines"] = wrap(s["text"], font_text, x1 - x0 - PAD_X * 2)
        s["h"] = len(s["lines"]) * LINE_H + PAD_Y * 2

    # 가장 높은 말풍선이 들어갈 만큼만 위를 넓힌다
    top_pad = max(0, math.ceil(max(
        s["h"] + TAIL_H + HEAD_GAP + TOP_MARGIN - s["head_top"] for s in students)))

    src = Image.open(src_path).convert("RGB").crop(spec["crop"])
    canvas = Image.new("RGB", (src.width, src.height + top_pad), "white")
    canvas.paste(src, (0, top_pad))
    d = ImageDraw.Draw(canvas)

    for s in students:
        x0, x1 = s["slot"]
        tip_y = s["head_top"] + top_pad - HEAD_GAP
        bottom = tip_y - TAIL_H
        top = bottom - s["h"]
        d.polygon(bubble_polygon(x0, top, x1, bottom, s["tip_x"], tip_y),
                  fill="white", outline=LINE, width=STROKE)
        for i, line in enumerate(s["lines"]):        # 가운데 정렬
            w = _width(line, font_text)
            d.text(((x0 + x1 - w) / 2, top + PAD_Y + i * LINE_H), line,
                   font=font_text, fill=INK)
        lx, ly = s["label_pos"]
        d.text((lx, ly + top_pad), s["label"], font=font_label, fill=INK, anchor="mm")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / f"{name}.png"
    canvas.save(out)
    print(f"{out.relative_to(ROOT)}  {canvas.width}x{canvas.height}  top_pad={top_pad}")
    for s in students:
        print(f"  {s['label']}: {' / '.join(s['lines'])}")


def probe(path):
    """좌표 잡기용 — 잉크 분포를 40px 격자로 찍는다 (`.`빔 `-`옅음 `*`중간 `#`짙음)."""
    im = Image.open(path).convert("L")
    w, h = im.size
    px = im.load()
    cell = 40
    print(f"{path}  {w}x{h}   (열 = x/{cell})")
    print("     " + "".join(f"{x // cell % 10}" for x in range(0, w, cell)))
    for y in range(0, h, cell):
        row = ""
        for x in range(0, w, cell):
            n = sum(1 for yy in range(y, min(y + cell, h))
                    for xx in range(x, min(x + cell, w)) if px[xx, yy] < 200)
            row += "." if n == 0 else ("-" if n < 40 else ("*" if n < 300 else "#"))
        print(f"{y:5d} {row}")


def main(argv):
    if argv and argv[0] == "--probe":
        if len(argv) < 2:
            raise SystemExit("사용법: python tools/make_talk_figure.py --probe <원본.png>")
        probe(argv[1])
        return
    names = argv or list(FIGURES)
    for name in names:
        if name not in FIGURES:
            raise SystemExit(f"모르는 그림: {name} (가능: {', '.join(FIGURES)})")
        build(name, FIGURES[name])


if __name__ == "__main__":
    main(sys.argv[1:])
