import {
  COLUMN_BOTTOM,
  COLUMN_TOP,
  MAX_QUESTION_GAP,
  MAX_QUESTIONS_PER_COLUMN,
  MIN_ALIGNED_GAP,
  MIN_QUESTION_GAP,
  QUESTION_TO_PASSAGE_GAP,
  SUBMIT_ACTION_BLOCK,
  SUBMIT_ACTION_GAP,
  SUBMIT_ACTION_H,
} from './constants'
import type {
  PackInput,
  PackedColumn,
  PackedPage,
  PassageMeasure,
  PassageSegment,
  PlacedItem,
  PlacedPassage,
  PlacedQuestion,
} from './types'

type Cursor = {
  pages: PackedPage[]
  pageIndex: number
  colIndex: 0 | 1
  used: number
  contentHeightFirst: number
  contentHeightContinued: number
}

function emptyColumn(): PackedColumn {
  return { items: [] }
}

function emptyPage(headerKind: PackedPage['headerKind']): PackedPage {
  return { headerKind, left: emptyColumn(), right: emptyColumn() }
}

/**
 * 한 단에 담을 수 있는 높이.
 *
 * 넘겨받은 `contentHeight` 는 단이 **차지하는** 높이고, 그중 아래 `COLUMN_BOTTOM` 은
 * `SheetColumn` 이 패딩으로 비워 둔다. 여기서 빼지 않으면 패킹이 그 자리까지
 * 쓸 수 있다고 보고 마지막 문제를 밀어 넣어 잘린다.
 * (위쪽 `COLUMN_TOP` 은 `ensureColumnTop` 이 `used` 로 먼저 깎는다.)
 */
function colHeight(c: Cursor): number {
  const full = c.pageIndex === 0 ? c.contentHeightFirst : c.contentHeightContinued
  return full - COLUMN_BOTTOM
}

function currentColumn(c: Cursor): PackedColumn {
  const page = c.pages[c.pageIndex]
  return c.colIndex === 0 ? page.left : page.right
}

function ensurePage(c: Cursor) {
  while (c.pages.length <= c.pageIndex) {
    const kind = c.pages.length === 0 ? 'first' : 'continued'
    c.pages.push(emptyPage(kind))
  }
}

function advanceColumn(c: Cursor) {
  if (c.colIndex === 0) {
    c.colIndex = 1
  } else {
    c.pageIndex += 1
    c.colIndex = 0
    ensurePage(c)
  }
  c.used = 0
}

function ensureColumnTop(c: Cursor) {
  if (c.used === 0) {
    c.used = COLUMN_TOP
  }
}

function lastItemType(col: PackedColumn): PlacedItem['type'] | null {
  const last = col.items[col.items.length - 1]
  return last?.type ?? null
}

function measure(
  input: PackInput,
  passage: PassageMeasure,
  showIntro: boolean,
  segments: PassageSegment[],
  openTop = false,
  openBottom = false,
): number {
  return input.measurePassage({
    passageId: passage.id,
    showIntro,
    segments,
    openTop,
    openBottom,
  })
}

function fitPrefix(
  text: string,
  indent: boolean,
  showIntro: boolean,
  already: PassageSegment[],
  avail: number,
  input: PackInput,
  passage: PassageMeasure,
  openTop: boolean,
  openBottom: boolean,
): { fit: string; rest: string } {
  if (!text) return { fit: '', rest: '' }

  const heightOf = (prefix: string) =>
    measure(
      input,
      passage,
      showIntro,
      [...already, { text: prefix, indent }],
      openTop,
      openBottom,
    )

  if (heightOf(text) <= avail) {
    return { fit: text, rest: '' }
  }

  let lo = 0
  let hi = text.length
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    if (heightOf(text.slice(0, mid)) <= avail) {
      lo = mid
    } else {
      hi = mid - 1
    }
  }

  let cut = lo
  if (cut > 0 && cut < text.length) {
    const window = text.slice(Math.max(0, cut - 12), cut)
    const breakAt = Math.max(
      window.lastIndexOf(' '),
      window.lastIndexOf('\n'),
      window.lastIndexOf('.'),
      window.lastIndexOf('。'),
      window.lastIndexOf('…'),
    )
    if (breakAt >= 0) {
      const adjusted = Math.max(0, cut - 12) + breakAt + 1
      if (adjusted > 0 && heightOf(text.slice(0, adjusted)) <= avail) {
        cut = adjusted
      }
    }
  }

  return { fit: text.slice(0, cut), rest: text.slice(cut) }
}

function placePassageFragment(
  c: Cursor,
  passage: PassageMeasure,
  showIntro: boolean,
  segments: PassageSegment[],
  openTop: boolean,
  openBottom: boolean,
  height: number,
  gapBefore: number,
) {
  const item: PlacedPassage = {
    type: 'passage',
    passageId: passage.id,
    showIntro,
    segments,
    openTop,
    openBottom,
    gapBefore,
  }
  currentColumn(c).items.push(item)
  c.used += gapBefore + height
}

function placePassage(c: Cursor, input: PackInput, passage: PassageMeasure) {
  const queue: PassageSegment[] = passage.paragraphs.map((text) => ({
    text,
    indent: true,
  }))
  let isStart = true

  while (queue.length > 0 || isStart) {
    ensurePage(c)
    ensureColumnTop(c)

    // 새 지문이 같은 단에서 문제 뒤에 올 때만 Q↔Q와 같은 고정 여백.
    // 단을 넘어 이어지는 조각(open-top)은 단 시작 COLUMN_TOP만 (gapBefore=0).
    const last = lastItemType(currentColumn(c))
    const gapBefore =
      isStart && last === 'question'
        ? QUESTION_TO_PASSAGE_GAP
        : isStart && last === 'passage'
          ? COLUMN_TOP
          : 0
    const avail = colHeight(c) - c.used - gapBefore
    const showIntro = isStart
    const openTop = !isStart

    // 여유 부족하면 다음 단에서 다시 (이어짐이 아닌 새 지문만)
    if (avail < 24 && c.used > COLUMN_TOP) {
      advanceColumn(c)
      continue
    }

    if (queue.length === 0) {
      const h = measure(input, passage, true, [])
      if (h > avail) {
        advanceColumn(c)
        continue
      }
      placePassageFragment(c, passage, true, [], false, false, h, gapBefore)
      return
    }

    const frag: PassageSegment[] = []
    let stopped = false

    while (queue.length > 0 && !stopped) {
      const next = queue[0]!
      const withFull = [...frag, next]
      const moreAfter = queue.length > 1
      const hFull = measure(
        input,
        passage,
        showIntro,
        withFull,
        openTop,
        moreAfter,
      )

      if (hFull <= avail) {
        frag.push(queue.shift()!)
        continue
      }

      if (!moreAfter) {
        const hClosed = measure(
          input,
          passage,
          showIntro,
          withFull,
          openTop,
          false,
        )
        if (hClosed <= avail) {
          frag.push(queue.shift()!)
          continue
        }
      }

      const { fit, rest } = fitPrefix(
        next.text,
        next.indent,
        showIntro,
        frag,
        avail,
        input,
        passage,
        openTop,
        true,
      )

      if (fit.length > 0) {
        frag.push({ text: fit, indent: next.indent })
        if (rest.length > 0) {
          queue[0] = { text: rest, indent: false }
        } else {
          queue.shift()
        }
      }
      stopped = true
    }

    if (frag.length === 0) {
      if (c.used > COLUMN_TOP) {
        advanceColumn(c)
        continue
      }
      const next = queue[0]!
      const force = next.text.slice(0, Math.max(1, Math.min(8, next.text.length)))
      const rest = next.text.slice(force.length)
      frag.push({ text: force, indent: next.indent })
      if (rest.length > 0) {
        queue[0] = { text: rest, indent: false }
      } else {
        queue.shift()
      }
    }

    let openBottom = queue.length > 0
    let h = measure(input, passage, showIntro, frag, openTop, openBottom)

    if (!openBottom && h > avail) {
      const last = frag[frag.length - 1]!
      const already = frag.slice(0, -1)
      const { fit, rest } = fitPrefix(
        last.text,
        last.indent,
        showIntro,
        already,
        avail,
        input,
        passage,
        openTop,
        true,
      )
      frag.length = 0
      frag.push(...already)
      if (fit.length > 0) {
        frag.push({ text: fit, indent: last.indent })
      }
      const rem = rest.length > 0 ? rest : last.text.slice(fit.length)
      if (rem.length > 0) queue.unshift({ text: rem, indent: false })
      openBottom = queue.length > 0
      h = measure(input, passage, showIntro, frag, openTop, openBottom)
    }

    if (frag.length === 0) {
      advanceColumn(c)
      continue
    }

    placePassageFragment(
      c,
      passage,
      showIntro,
      frag,
      openTop,
      openBottom,
      h,
      gapBefore,
    )
    isStart = false

    if (openBottom) {
      c.used = colHeight(c)
      advanceColumn(c)
    }
  }
}

function questionHeight(input: PackInput, id: number): number {
  return input.questionHeights.get(id) ?? 0
}

/**
 * 문제 배치.
 * @param reserveSubmit 이 묶음이 시험 마지막 문제들이면 제출 버튼 높이를 함께 예약
 */
function placeQuestions(
  c: Cursor,
  input: PackInput,
  questionIds: number[],
  reserveSubmit = false,
) {
  let idx = 0

  while (idx < questionIds.length) {
    ensurePage(c)
    ensureColumnTop(c)

    const col = currentColumn(c)
    const avail = colHeight(c) - c.used
    const last = lastItemType(col)
    const lead =
      last === 'passage'
        ? COLUMN_TOP
        : last === 'question'
          ? MIN_QUESTION_GAP
          : 0

    const remaining = questionIds.length - idx

    // 목표 단 수가 있으면 남은 문제를 남은 단에 고르게 나눈다.
    // (한 단에 몰아 담아 마지막 단이 비는 것을 막는다)
    let cap = Math.min(MAX_QUESTIONS_PER_COLUMN, remaining)
    if (input.targetColumns) {
      const columnsUsed = c.pageIndex * 2 + c.colIndex
      const columnsLeft = Math.max(1, input.targetColumns - columnsUsed)
      cap = Math.min(cap, Math.ceil(remaining / columnsLeft))
    }

    let bestK = 0

    for (let k = cap; k >= 1; k -= 1) {
      let sum = 0
      for (let i = 0; i < k; i += 1) {
        sum += questionHeight(input, questionIds[idx + i])
      }
      const minGaps = k > 1 ? (k - 1) * MIN_QUESTION_GAP : 0
      const isFinalBatch = reserveSubmit && idx + k === questionIds.length
      const tail = isFinalBatch ? SUBMIT_ACTION_BLOCK : 0
      if (lead + sum + minGaps + tail <= avail) {
        bestK = k
        break
      }
    }

    if (bestK === 0) {
      if (c.used > COLUMN_TOP) {
        advanceColumn(c)
        continue
      }
      bestK = 1
    }

    const ids = questionIds.slice(idx, idx + bestK)
    const sum = ids.reduce((a, id) => a + questionHeight(input, id), 0)
    const isFinalBatch = reserveSubmit && idx + bestK === questionIds.length
    const tail = isFinalBatch ? SUBMIT_ACTION_BLOCK : 0
    // 마지막 단도 같은 규칙으로 벌린다 (제출 블록 높이는 빼고 계산)
    const stretch = bestK > 1
    const free = Math.max(0, avail - lead - sum - tail)
    const gap = stretch
      ? Math.max(MIN_QUESTION_GAP, Math.min(MAX_QUESTION_GAP, free / (bestK - 1)))
      : 0

    ids.forEach((id, i) => {
      const gapBefore = i === 0 ? lead : gap
      currentColumn(c).items.push({
        type: 'question',
        questionId: id,
        gapBefore,
      })
      c.used += gapBefore + questionHeight(input, id)
    })

    if (isFinalBatch) {
      currentColumn(c).items.push({
        type: 'submit-action',
        gapBefore: SUBMIT_ACTION_GAP,
      })
      c.used += SUBMIT_ACTION_GAP + SUBMIT_ACTION_H
    }

    if (stretch) {
      c.used = colHeight(c)
    }

    idx += bestK

    // 한 단 문제 배치는 한 번에 — 나머지는 다음 단
    if (idx < questionIds.length) {
      advanceColumn(c)
    }
  }
}

/** 단이 문제로만 이뤄져 있으면 그 문제들을 돌려준다 (끝의 제출 블록은 눈감아 준다) */
function questionOnlyItems(col: PackedColumn): PlacedQuestion[] | null {
  const qs: PlacedQuestion[] = []
  for (let i = 0; i < col.items.length; i += 1) {
    const it = col.items[i]!
    if (it.type === 'question') {
      qs.push(it)
    } else if (it.type === 'submit-action' && i === col.items.length - 1) {
      // 제출 블록은 단 맨 아래 고정(marginTop: auto)이라 줄 맞추기와 무관
    } else {
      return null
    }
  }
  return qs
}

/**
 * 두 단의 문제 줄 맞추기.
 *
 * 남는 세로를 단마다 따로 나누면 옆 단과 n번째 문제의 시작 높이가 어긋난다.
 * 문제만 담긴 페이지는 줄 높이를 두 단의 최대값으로 통일해 n번째 문제가
 * 양 단에서 같은 높이에서 시작하게 한다. 지문이 낀 단은 줄 개념이 없어 그대로 둔다.
 */
function alignQuestionRows(pages: PackedPage[], input: PackInput) {
  pages.forEach((page, pageIndex) => {
    const left = questionOnlyItems(page.left)
    const right = questionOnlyItems(page.right)
    if (!left?.length || !right?.length) return

    const rows = Math.max(left.length, right.length)
    if (rows < 2) return

    const rowH: number[] = []
    for (let i = 0; i < rows; i += 1) {
      rowH.push(
        Math.max(
          ...[left[i], right[i]]
            .filter((q): q is PlacedQuestion => q !== undefined)
            .map((q) => questionHeight(input, q.questionId)),
        ),
      )
    }

    const full =
      pageIndex === 0 ? input.contentHeightFirst : input.contentHeightContinued
    const colH = full - COLUMN_BOTTOM
    const hasSubmit = [page.left, page.right].some((col) =>
      col.items.some((it) => it.type === 'submit-action'),
    )
    const tail = hasSubmit ? SUBMIT_ACTION_BLOCK : 0
    const free =
      colH - COLUMN_TOP - rowH.reduce((a, b) => a + b, 0) - tail

    // 양 단의 큰 문제가 서로 다른 줄에 있으면 최대 줄 높이 합이 단을 넘을 수 있다.
    // 간격을 MIN_ALIGNED_GAP 까지는 좁혀서라도 줄을 맞추고, 그마저 안 되면
    // 줄을 맞추다 잘리느니 원래 배치를 둔다.
    if (free < (rows - 1) * MIN_ALIGNED_GAP) return
    const gap = Math.min(MAX_QUESTION_GAP, free / (rows - 1))

    for (const col of [left, right]) {
      col.forEach((q, i) => {
        if (i === 0) return
        const prev = col[i - 1]!
        q.gapBefore =
          gap + rowH[i - 1]! - questionHeight(input, prev.questionId)
      })
    }
  })
}

export function packSheet(input: PackInput): PackedPage[] {
  const c: Cursor = {
    pages: [],
    pageIndex: 0,
    colIndex: 0,
    used: 0,
    contentHeightFirst: input.contentHeightFirst,
    contentHeightContinued: input.contentHeightContinued,
  }
  ensurePage(c)

  // 지문 묶음과 단일 문제 구간을 데이터 순서대로 배치한다.
  const lastIndex = input.items.length - 1

  for (let i = 0; i < input.items.length; i += 1) {
    const item = input.items[i]!
    const isLast = i === lastIndex
    if (item.kind === 'passage') {
      placePassage(c, input, item.passage)
      placeQuestions(c, input, item.passage.questionIds, isLast)
    } else {
      placeQuestions(c, input, item.questionIds, isLast)
    }
  }

  alignQuestionRows(c.pages, input)

  return c.pages.length > 0 ? c.pages : [emptyPage('first')]
}
