import {
  COLUMN_TOP,
  MAX_QUESTIONS_PER_COLUMN,
  MIN_QUESTION_GAP,
} from './constants'
import type {
  PackInput,
  PackedColumn,
  PackedPage,
  PassageMeasure,
  PassageSegment,
  PlacedItem,
  PlacedPassage,
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

function colHeight(c: Cursor): number {
  return c.pageIndex === 0 ? c.contentHeightFirst : c.contentHeightContinued
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

    // 같은 단에 이미 내용이 있으면 지문도 COLUMN_TOP (used에는 배치 시 반영)
    const gapBefore = c.used > COLUMN_TOP ? COLUMN_TOP : 0
    const avail = colHeight(c) - c.used - gapBefore
    const showIntro = isStart
    const openTop = !isStart

    // 여유 부족하면 다음 단에서 다시
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

function placeQuestions(c: Cursor, input: PackInput, questionIds: number[]) {
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
    let bestK = 0

    for (let k = Math.min(MAX_QUESTIONS_PER_COLUMN, remaining); k >= 1; k -= 1) {
      let sum = 0
      for (let i = 0; i < k; i += 1) {
        sum += questionHeight(input, questionIds[idx + i])
      }
      const minGaps = k > 1 ? (k - 1) * MIN_QUESTION_GAP : 0
      if (lead + sum + minGaps <= avail) {
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
    const stretch = bestK > 1
    const free = Math.max(0, avail - lead - sum)
    const gap = stretch ? free / (bestK - 1) : 0

    ids.forEach((id, i) => {
      const gapBefore = i === 0 ? lead : gap
      currentColumn(c).items.push({
        type: 'question',
        questionId: id,
        gapBefore,
      })
      c.used += gapBefore + questionHeight(input, id)
    })

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

  for (const passage of input.passages) {
    placePassage(c, input, passage)
    placeQuestions(c, input, passage.questionIds)
  }

  return c.pages.length > 0 ? c.pages : [emptyPage('first')]
}
