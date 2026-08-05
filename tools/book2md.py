"""
『구글 제미나이』 원본 PDF → 장별 Markdown 변환기

폰트/크기 조합으로 위계를 판별한다 (PyMuPDF span 메타데이터).
  SDPsyche-Italic  66      장 번호            → #
  SDPsyche-Upright 35      장 제목
  SDPsyche-Upright 45/17   마당 제목/번호
  SDPsyche-Upright 20      절 번호            → ##
  NanumSquareNeo-cBd 18    절 제목
  NanumSquareNeo-cBd 11.5  소제목             → ###
  NanumSquareNeo-dEb 11.5  '하면 된다!' 라벨  → ### 하면 된다! — ...
  SSiGothic_150 10.5/11.0  실습 단계 제목     → ####
  SSiGothic_150 9.5        단계 번호(01,02)
  NanumSquareNeo-cBd 9.0   박스 라벨 (1분 완성 퀴즈 / 여기서 잠깐! / 이렇게 써보세요!)
  NanumSquareNeo-cBd 8.5/10 AI 활용 능력 점검
  SSiMyungJo_120 10.5      본문
  SSiGothic_140 10.0       본문 강조          → **볼드**
  SSiMyungJo_120 8.5       본문 안 괄호 주석  → 인라인 유지
  SSiGothic_130 6~8.2      키캡(Enter, Ctrl)  → `Enter`
  SSiGothic_160 6.1/6.8    원문자 번호        → ❶❷❸
  SSiGothic_110 8.0        그림 캡션 / 참고 노트
  KingSejongInstitute 8.0  말풍선 팁
  SSiGothic_120/140 9.0    장 도입문 / 제미나이 대화 예시 / 그림 속 라벨
  SSiGothic_120 8.8        퀴즈·여기서 잠깐 본문
  SSiGothic_120,150 7.5    퀴즈 정답
  SSiGothic_120 9.5        AI 활용 능력 점검 본문
  Dinmed / SSiGothic_120 7.0 (y>695)  쪽 번호·러닝헤드 → 제거
"""
import re
from pathlib import Path

import fitz

FOOTER_Y = 695
CIRCLED = "❶❷❸❹❺❻❼❽❾"

STYLE = {
    ("SDPsyche-Italic", 66.0): "chapter_no",
    ("SDPsyche-Upright", 35.0): "chapter_title",
    ("SDPsyche-Upright", 45.0): "part_title",
    ("SDPsyche-Upright", 17.0): "part_no",
    ("SDPsyche-Upright", 20.0): "section_no",
    ("NanumSquareNeoTTF-cBd", 18.0): "section_title",
    ("NanumSquareNeoTTF-cBd", 11.5): "h3",
    ("NanumSquareNeoTTF-dEb", 11.5): "doit",
    ("NanumSquareNeoTTF-cBd", 9.0): "boxlabel",
    ("NanumSquareNeoTTF-dEb", 9.5): "mission",
    ("NanumSquareNeoTTF-cBd", 8.5): "check",
    ("NanumSquareNeoTTF-cBd", 10.0): "check",
    ("NanumSquareNeoTTF-cBd", 7.3): "check",
    ("TDc_SSiGothic_150_OTF", 10.5): "h4",
    ("TDc_SSiGothic_150_OTF", 11.0): "h4",
    ("TDc_SSiGothic_150_OTF", 9.5): "step_no",
    ("TDc_SSiGothic_150_OTF", 7.5): "quiz_answer",
    ("TDc_SSiMyungJo_120_OTF", 10.5): "body",
    ("TDc_SSiMyungJo_120_OTF", 8.5): "body",
    ("TDc_SSiGothic_140_OTF", 10.0): "body_em",
    ("TDc_SSiGothic_140_OTF", 10.5): "caption_em",
    ("TDc_SSiGothic_110_OTF", 8.0): "note",
    ("TDc_SSiGothic_140_OTF", 8.0): "note_em",
    ("KingSejongInstitute-Regu", 8.0): "bubble",
    ("TDc_SSiGothic_140_OTF", 9.2): "boxlabel_sub",
    ("TDc_SSiGothic_120_OTF", 9.0): "gothic9",
    ("TDc_SSiGothic_140_OTF", 9.0): "gothic9_em",
    ("TDc_SSiGothic_130_OTF", 9.0): "intro",
    ("TDc_SSiGothic_130_OTF", 11.0): "part_toc",
    ("SDPsyche-Italic", 11.0): "part_toc",
    ("TDc_SSiGothic_120_OTF", 9.5): "mission_body",
    ("TDc_SSiGothic_140_OTF", 9.5): "gothic9_em",
    ("TDc_SSiGothic_120_OTF", 8.8): "small",
    ("TDc_SSiGothic_140_OTF", 8.8): "small_em",
    ("TDc_SSiGothic_120_OTF", 7.5): "quiz_answer",
    ("TDc_SSiGothic_120_OTF", 8.0): "small2",
    ("TDc_SSiGothic_160_OTF", 6.1): "circled",
    ("TDc_SSiGothic_160_OTF", 6.8): "circled",
    ("TDc_SSiGothic_160_OTF", 7.7): "circled",
}
KEYCAP_FONTS = {"TDc_SSiGothic_130_OTF"}
EM_ROLES = {"body_em", "note_em", "small_em", "caption_em", "gothic9_em"}
# 인라인 장식이 대표 역할을 뺏지 않도록
INLINE_ROLES = EM_ROLES | {"circled"}

HEADING_ROLES = {
    "chapter_no", "chapter_title", "part_title", "part_no", "section_no",
    "section_title", "h3", "h4", "doit", "boxlabel", "check", "step_no", "mission",
}
# 역할별 여러 줄 병합 허용 세로 간격
MERGE_GAP = {
    "chapter_title": 60, "part_title": 60, "section_title": 32,
    "h3": 22, "h4": 22, "body": 26, "intro": 26, "gothic9": 26,
    "note": 16, "caption": 16, "bubble": 16, "small": 22, "small2": 16,
    "mission_body": 22, "figlabel": 130, "part_toc": 26, "quiz_answer": 16,
}
# 쪽이 바뀌어도 이어지는 역할 (앞 줄이 오른쪽 끝까지 찬 경우에만)
CROSS_PAGE_ROLES = {"body", "gothic9", "small", "intro"}
TEXT_RIGHT_EDGE = 480
# 수동 줄바꿈이라 이어붙일 때 공백이 필요한 역할
SPACE_JOIN = {"note", "caption", "bubble", "figlabel", "small2", "part_toc",
              "chapter_title", "section_title", "part_title", "h3", "h4"}


def span_role(sp):
    return STYLE.get((sp["font"], round(sp["size"], 1)))


class Line:
    def __init__(self, spans):
        self.spans = sorted(spans, key=lambda s: s["bbox"][0])
        self.x0 = min(s["bbox"][0] for s in spans)
        self.x1 = max(s["bbox"][2] for s in spans)
        self.y0 = min(s["bbox"][1] for s in spans)
        self.y1 = max(s["bbox"][3] for s in spans)
        self.in_image = False
        self.near_caption = False

    @property
    def ymid(self):
        return (self.y0 + self.y1) / 2

    def absorb(self, other):
        self.spans = sorted(self.spans + other.spans, key=lambda s: s["bbox"][0])
        self.x0 = min(self.x0, other.x0)
        self.x1 = max(self.x1, other.x1)
        self.y0 = min(self.y0, other.y0)
        self.y1 = max(self.y1, other.y1)

    @property
    def raw(self):
        return "".join(s["text"] for s in self.spans)

    def role(self):
        weights = {}
        for s in self.spans:
            r = span_role(s)
            if r is None or r in INLINE_ROLES:
                continue
            if s["font"] in KEYCAP_FONTS and round(s["size"], 1) < 9.0:
                continue
            weights[r] = weights.get(r, 0) + len(s["text"].strip())
        if weights:
            return max(weights, key=weights.get)
        # 줄 전체가 강조 스타일이면 바탕이 되는 본문 역할로 되돌린다
        fallback = {"body_em": "body", "gothic9_em": "gothic9",
                    "small_em": "small", "caption_em": "caption",
                    "note_em": "note_em"}
        for s in self.spans:
            r = span_role(s)
            if r in fallback:
                return fallback[r]
        return "unknown"

    def text(self):
        out = []
        prev_x1 = None
        for s in self.spans:
            t = s["text"]
            if not t:
                continue
            # 같은 줄에서 span이 갈릴 때 사라진 어절 사이 공백 복원
            if (
                prev_x1 is not None
                and s["bbox"][0] - prev_x1 > 1.2
                and not t.startswith(" ")
                and out
                and not out[-1].endswith(" ")
            ):
                out.append(" ")
            prev_x1 = s["bbox"][2]
            r = span_role(s)
            if r == "circled":
                d = t.strip()
                out.append(CIRCLED[int(d) - 1] + " " if d.isdigit() and 1 <= int(d) <= 9 else d)
                continue
            if r == "step_no" and t.strip():
                out.append(f"**{t.strip()}** ")
                continue
            if s["font"] in KEYCAP_FONTS and round(s["size"], 1) < 9.0:
                out.append(f"{' ' if t.startswith(' ') else ''}`{t.strip()}`"
                           f"{' ' if t.endswith(' ') else ''}")
                continue
            if r in EM_ROLES and t.strip() and not _punct_only(t):
                out.append(f"{' ' if t.startswith(' ') else ''}**{t.strip()}**"
                           f"{' ' if t.endswith(' ') else ''}")
                continue
            out.append(t)
        return "".join(out)


def _punct_only(t):
    return not re.search(r"[0-9A-Za-z가-힣]", t)


def clean(s):
    s = s.replace("​", "").replace("﻿", "").replace("‌", "")
    s = re.sub(r"[  -   　]", " ", s)
    s = re.sub(r"[ \t]+", " ", s)
    return s.strip()


def join_lines(texts, role, lines=None):
    """줄 이어붙이기.

    본문·대화 예시는 오른쪽 끝까지 찬 줄만 이어 붙이고(자동 줄바꿈),
    중간에서 끝난 줄은 의도적 줄바꿈으로 보아 개행을 유지한다.
    """
    if not texts:
        return ""
    if role == "figlabel":
        return clean(" · ".join(t.strip() for t in texts))
    if role in SPACE_JOIN:
        return clean(" ".join(t.strip() for t in texts))
    if role == "gothic9" and lines and len(lines) > 1:
        right = max(l.x1 for l in lines)
        out = texts[0].lstrip()
        for t, prev in zip(texts[1:], lines[:-1]):
            out = out.rstrip() + (t if prev.x1 >= right - 12 else "\n" + t.lstrip())
        return "\n".join(clean(p) for p in out.split("\n")).strip()
    out = texts[0].lstrip()
    for t in texts[1:]:
        out = out.rstrip("\n") + t
    return clean(out)


def page_lines(page):
    d = page.get_text("dict")
    page_area = page.rect.width * page.rect.height
    images = [
        b["bbox"] for b in d["blocks"]
        if b["type"] == 1
        and (b["bbox"][2] - b["bbox"][0]) * (b["bbox"][3] - b["bbox"][1]) < page_area * 0.4
    ]
    lines = []
    for b in d["blocks"]:
        if b["type"] != 0:
            continue
        for ln in b["lines"]:
            spans = [s for s in ln["spans"] if s["text"].strip() and s["bbox"][1] <= FOOTER_Y]
            if spans:
                lines.append(Line(spans))
    lines.sort(key=lambda l: (round(l.y0, 1), l.x0))

    # 시각적으로 같은 줄(원문자 번호 + 본문, 단계 번호 + 제목) 병합
    merged = []
    for l in lines:
        if merged:
            p = merged[-1]
            gap = max(l.x0 - p.x1, p.x0 - l.x1)
            if abs(l.ymid - p.ymid) <= 4.5 and -2 <= gap <= 30:
                p.absorb(l)
                continue
        merged.append(l)
    merged.sort(key=lambda l: (round(l.y0, 1), l.x0))

    for l in merged:
        l.in_image = any(
            ix0 - 3 <= l.x0 and l.x1 <= ix1 + 3 and iy0 - 3 <= l.y0 and l.y1 <= iy1 + 3
            for ix0, iy0, ix1, iy1 in images
        ) and len(clean(l.raw)) <= 25
        # 캡션: 바로 위 이미지(들)의 왼쪽 끝에 맞춰 붙는 한 줄
        above = [b for b in images if 2 <= l.y0 - b[3] <= 12]
        if above:
            ux0 = min(b[0] for b in above)
            ux1 = max(b[2] for b in above)
            l.near_caption = abs(l.x0 - ux0) <= 4 and l.x1 <= ux1 + 8
    return merged


def printed_page_no(page):
    for b in page.get_text("dict")["blocks"]:
        if b["type"]:
            continue
        for ln in b["lines"]:
            for sp in ln["spans"]:
                if sp["font"] == "Dinmed" and sp["text"].strip().isdigit():
                    return sp["text"].strip()
    return ""


class Doc:
    def __init__(self):
        self.parts = []

    def add(self, text=""):
        if not text:
            if self.parts and self.parts[-1] == "":
                return
            self.parts.append("")
        else:
            self.parts.append(text)

    def block(self, text):
        self.add()
        self.add(text)
        self.add()

    def render(self):
        return re.sub(r"\n{3,}", "\n\n", "\n".join(self.parts).strip()) + "\n"


def table_rows(lines, roles):
    """표 영역(8pt 고딕 셀들)을 행·열로 복원 — 실패하면 None"""
    idx = [i for i, r in enumerate(roles) if r in ("small2", "note_em")]
    if len(idx) < 6:
        return None
    # 셀 단위로 다시 쪼갠다 (같은 행의 이웃 칸이 한 줄로 합쳐져 있을 수 있음)
    cells = []
    for i in idx:
        run = []
        for sp in lines[i].spans:
            if run and sp["bbox"][0] - run[-1]["bbox"][2] > 8:
                cells.append(Line(run))
                run = []
            run.append(sp)
        if run:
            cells.append(Line(run))
    # 열 클러스터는 좁은 칸으로만 만든다 (여러 칸을 병합한 넓은 칸이 열을 잇지 않도록)
    narrow = sorted((c for c in cells if c.x1 - c.x0 < 100), key=lambda c: c.x0)
    cols = []
    for c in narrow:
        if cols and c.x0 <= cols[-1][1] + 4:
            cols[-1][1] = max(cols[-1][1], c.x1)
        else:
            cols.append([c.x0, c.x1])
    if len(cols) < 3:
        return None
    cols = [c[0] for c in cols]
    rows, cur = [], [cells[0]]
    for c in sorted(cells, key=lambda c: c.ymid)[1:]:
        if c.ymid - cur[-1].ymid <= 8:
            cur.append(c)
        else:
            rows.append(cur)
            cur = [c]
    rows.append(cur)
    if len(rows) < 3:
        return None
    grid = []
    for row in rows:
        cells_by_col = {}
        for c in sorted(row, key=lambda c: c.x0):
            ci = max(i for i, cx in enumerate(cols) if c.x0 >= cx - 4)
            cells_by_col.setdefault(ci, []).append(clean(c.text()))
        grid.append([" ".join(cells_by_col.get(i, [])) for i in range(len(cols))])
    return grid, idx


def render_table(grid):
    width = max(len(r) for r in grid)
    rows = [r + [""] * (width - len(r)) for r in grid]
    keep = [i for i in range(width) if any(r[i].strip() for r in rows)]
    rows = [[r[i] for i in keep] for r in rows]
    width = len(keep)
    head = rows[0]
    out = ["| " + " | ".join(c.replace("|", "\\|") or " " for c in head) + " |",
           "|" + "---|" * width]
    for r in rows[1:]:
        out.append("| " + " | ".join(c.replace("|", "\\|") or " " for c in r) + " |")
    return "\n".join(out)


def classify(page, lines, opener):
    """줄별 역할 확정 — 이미지 관계·페이지 성격 반영"""
    roles = []
    for l in lines:
        r = l.role()
        if r == "unknown":
            roles.append(None)
            continue
        if r == "check" and (opener or l.y0 > 400):
            roles.append(None)      # 장 도입부 절 목록에 있는 라벨은 제목이 아니다
            continue
        if l.in_image and r in ("gothic9", "note", "small2", "body", "small"):
            r = "figlabel"
        elif r == "note":
            r = "caption" if l.near_caption else "note"
        elif r == "gothic9" and opener:
            r = "intro"
        roles.append(r)
    # 캡션처럼 보이지만 뒤에 참고 노트가 이어지면 노트의 첫 줄
    for i, r in enumerate(roles):
        if r == "caption" and i + 1 < len(roles) and roles[i + 1] == "note":
            if lines[i + 1].y0 - lines[i].y1 <= 16:
                roles[i] = "note"
    return roles


def convert(pdf_path, chapters, out_dir, part_meta):
    doc = fitz.open(pdf_path)
    src = Path(pdf_path).name
    written = []

    for ch in chapters:
        md = Doc()
        first, last = ch["pdf_range"]
        state = {}
        buf, buf_role, buf_prev = [], None, None
        deferred, pending_marker = [], None

        def flush():
            nonlocal buf, buf_role, buf_prev, deferred, pending_marker
            if buf:
                if pending_marker:
                    md.block(pending_marker)
                    pending_marker = None
                text = join_lines([l.text() for l in buf], buf_role, buf)
                if clean(text):
                    emit(md, buf_role, text, state)
            buf, buf_role, buf_prev = [], None, None
            # 오른쪽 여백에 떠 있던 참고·말풍선은 문단 뒤에 모아서 낸다
            group, grole = [], None
            for role, line in deferred:
                if grole == role and group and line.y0 - group[-1].y1 <= 16:
                    group.append(line)
                    continue
                if group:
                    emit(md, grole, join_lines([g.text() for g in group], grole, group), state)
                group, grole = [line], role
            if group:
                emit(md, grole, join_lines([g.text() for g in group], grole, group), state)
            deferred = []

        for pno in range(first - 1, last):
            page = doc[pno]
            lines = page_lines(page)
            opener = any(l.role() in ("chapter_no", "part_no") for l in lines)
            roles = classify(page, lines, opener)
            marker = f"<!-- p.{printed_page_no(page)} -->"
            new_page = True
            table = table_rows(lines, roles)
            table_idx = set(table[1]) if table else set()

            for i, (l, role) in enumerate(zip(lines, roles)):
                if role is None:
                    continue
                if i in table_idx:
                    if i == min(table_idx):
                        flush()
                        md.block(render_table(table[0]))
                    continue
                txt = l.text()
                if not clean(txt):
                    continue
                if role == "small2" and len(clean(txt)) <= 8:
                    role = "figlabel"       # 화면 캡처 위에 얹힌 짧은 라벨
                # 오른쪽 여백에 떠 있는 참고/말풍선은 문단을 끊지 않고 뒤로 미룬다
                if role in ("note", "bubble") and l.x0 > 300 and buf:
                    deferred.append((role, l))
                    continue
                if new_page:
                    cross = (
                        role == buf_role
                        and role in CROSS_PAGE_ROLES
                        and buf_prev is not None
                        and buf_prev.x1 >= TEXT_RIGHT_EDGE
                    )
                    if not cross:
                        flush()
                        md.block(marker)
                    else:
                        pending_marker = pending_marker or marker
                    new_page = False
                else:
                    mergeable = (
                        role == buf_role
                        and buf_prev is not None
                        and role in MERGE_GAP
                        and 0 <= l.y0 - buf_prev.y0 <= MERGE_GAP[role]
                        # 퀴즈 문항은 원문자 번호에서 새 항목으로 끊는다
                        and not (role == "small" and clean(txt)[:1] in CIRCLED)
                    )
                    if not mergeable:
                        flush()
                buf.append(l)
                buf_role, buf_prev = role, l
            if new_page:            # 내용이 하나도 없는 쪽
                flush()
                md.block(marker)
            state.pop("check", None)
        flush()

        text = postprocess(md.render())
        out = out_dir / ch["file"]
        out.write_text(frontmatter(ch, src, part_meta) + text, encoding="utf-8")
        written.append((out, len(text)))
        print(f"  wrote {out.name}  ({len(text):,} chars)")
    return written


def emit(md, role, text, state):
    t = clean(text)
    if not t:
        return

    if role == "chapter_no":
        state["chapter_no"] = t
        return
    if role == "chapter_title":
        md.block(f"# {state.pop('chapter_no', '')} {t}".strip())
        return
    if role == "part_no":
        state["part_no"] = t
        return
    if role == "part_title":
        md.block(f"# {state.pop('part_no', '')} {t}".strip())
        return
    if role == "section_no":
        state["section_no"] = t
        return
    if role == "section_title":
        check = state.pop("check", "")
        if check:
            md.block(f"## {check} — {t}")
        else:
            md.block(f"## {state.pop('section_no', '')} {t}".strip())
        return
    if role == "check":
        state["check"] = t
        return
    if role == "doit":
        state["doit"] = t.replace("}", "").strip()
        return
    if role == "h3":
        label = state.pop("doit", "").replace("}", "").strip()
        if t.startswith("하면 된다"):
            t = re.sub(r"^하면 된다!?\s*}?\s*", "", t)
            label = "하면 된다!"
        md.block(f"### {label} — {t}" if label else f"### {t}")
        return
    if role == "h4":
        step = state.pop("step_no", "")
        md.block("#### " + " ".join(x for x in (step, t) if x).replace("**", "").strip())
        return
    if role == "step_no":
        state["step_no"] = t
        return
    if role == "mission":
        state["mission"] = t
        return
    if role == "boxlabel":
        label = t.replace("}", "").strip()
        if label.startswith("1분 완성 퀴즈"):
            state["box"] = "quiz"
            md.block("### 1분 완성 퀴즈")
        elif label.startswith("여기서 잠깐"):
            state["box"] = "tip"
            state["tip_open"] = True
            md.add()
            md.add("> **여기서 잠깐!**")
        elif label.startswith("이렇게 써보세요"):
            state["box"] = "prompt"
            md.block("**이렇게 써보세요!**")
        else:
            state["box"] = None
            md.block(f"**{label}**")
        return
    if role == "boxlabel_sub":
        if state.pop("tip_open", False):
            md.add(f"> {t}")
            md.add()
        else:
            md.block(f"> **{t}**")
        return

    if role in ("body", "intro", "mission_body", "part_toc"):
        prefix = ""
        step = state.pop("step_no", None)
        if step:
            prefix = f"**{step}** "
        mission = state.pop("mission", None)
        if mission:
            prefix = f"**{mission}** "
        md.block(prefix + t)
        state["box"] = None
        return
    if role in ("gothic9", "gothic9_em"):
        if state.get("box") == "prompt":
            md.block("```\n" + t.replace("**", "") + "\n```")
        else:
            md.block("> " + t.replace("\n", "  \n> "))
        return
    if role == "small":
        if state.get("box") == "quiz":
            md.block(t if t[:1] not in CIRCLED else f"{CIRCLED.index(t[0]) + 1}. {t[1:].strip()}")
        else:
            md.block("> " + t)
        return
    if role == "quiz_answer":
        md.block("**정답** " + clean(t.replace("정답", "")))
        state["box"] = None
        return
    if role == "caption":
        md.block(f"*[그림] {t}*")
        return
    if role == "figlabel":
        md.block(f"*[그림 속 텍스트] {t}*")
        return
    if role == "note":
        md.block(f"> [참고] {t}")
        return
    if role == "bubble":
        md.block(f"> [말풍선] {t}")
        return
    md.block(t)


def postprocess(text):
    text = text.replace("****", "")
    text = re.sub(r"\*\*[ \t]+\*\*", " ", text)
    # [버튼] 강조가 대괄호 안쪽에서 끊긴 경우 바로잡기
    text = re.sub(r"\*\*\[([^\[\]\n]*?)\s*\*\*\s*\]", r"**[\1]**", text)
    text = re.sub(r"\[\*\*([^\[\]\n]*?)\*\*\]", r"**[\1]**", text)
    text = re.sub(r"\*\*[ \t]*\*\*", "", text)
    text = re.sub(r"\(\s*\)", "(____)", text)          # 퀴즈 빈칸
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"(?m)^<!-- p\.\d* -->\n\n(?=<!-- p\.)", "", text)
    return text


def frontmatter(ch, src, part_meta):
    return (
        "---\n"
        f"part: {part_meta}\n"
        f'chapter: "{ch["no"]}"\n'
        f"title: {ch['title']}\n"
        f"pages: {ch['pages']}\n"
        f"source: {src}\n"
        "---\n\n"
    )
