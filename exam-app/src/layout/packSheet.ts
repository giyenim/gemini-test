import {
  COLUMN_TOP,
  MAX_QUESTION_GAP,
  MAX_QUESTIONS_PER_COLUMN,
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

  return c.pages.length > 0 ? c.pages : [emptyPage('first')]
}
