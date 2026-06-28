// OCRの行ボックス(bbox付き)から「表の行」を復元する。
// 検査票は複数パネル(左右)×複数列(項目/結果/単位/基準値)のことがあるため、
//  1) x方向の大きな隙間でパネルに分割
//  2) 各パネル内で y近接の行にまとめ、x順に連結
// これで「項目 値 基準値」の行に近づけ、extractLabValues に渡せる形にする。
import type { OcrLine } from './types'

interface B {
  text: string
  x0: number
  y0: number
  x1: number
  y1: number
  cx: number
  cy: number
  h: number
}

function toB(l: OcrLine): B | null {
  if (!l.bbox || !l.text?.trim()) return null
  const { x0, y0, x1, y1 } = l.bbox
  return { text: l.text, x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, h: Math.max(1, y1 - y0) }
}

function median(nums: number[]): number {
  if (!nums.length) return 0
  const s = [...nums].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)]
}

/** x方向の被覆から大きな隙間を見つけ、パネル境界(xの分割点)を返す */
function panelSplits(boxes: B[], width: number): number[] {
  const intervals = boxes.map((b) => [b.x0, b.x1] as [number, number]).sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = []
  for (const [s, e] of intervals) {
    const last = merged[merged.length - 1]
    if (last && s <= last[1] + 2) last[1] = Math.max(last[1], e)
    else merged.push([s, e])
  }
  const splits: number[] = []
  const gapThreshold = width * 0.06 // パネル間の隙間とみなす最小幅
  for (let i = 1; i < merged.length; i++) {
    const gap = merged[i][0] - merged[i - 1][1]
    if (gap >= gapThreshold) splits.push((merged[i - 1][1] + merged[i][0]) / 2)
  }
  return splits
}

function panelIndex(cx: number, splits: number[]): number {
  let idx = 0
  for (const s of splits) if (cx > s) idx++
  return idx
}

/** y近接で行にまとめ、x順に連結 */
function groupRows(boxes: B[]): string[] {
  if (!boxes.length) return []
  const medH = median(boxes.map((b) => b.h)) || 20
  const sorted = [...boxes].sort((a, b) => a.cy - b.cy)
  const rows: B[][] = []
  let cur: B[] = []
  let curY: number | null = null
  for (const b of sorted) {
    if (curY === null || Math.abs(b.cy - curY) <= medH * 0.7) {
      cur.push(b)
      curY = curY === null ? b.cy : (curY * (cur.length - 1) + b.cy) / cur.length
    } else {
      rows.push(cur)
      cur = [b]
      curY = b.cy
    }
  }
  if (cur.length) rows.push(cur)
  return rows.map((r) =>
    r
      .sort((a, b) => a.x0 - b.x0)
      .map((b) => b.text.trim())
      .join(' '),
  )
}

export function reconstructRows(lines: OcrLine[]): string[] {
  const boxes = lines.map(toB).filter((b): b is B => b !== null)
  if (boxes.length === 0) return lines.map((l) => l.text).filter(Boolean)

  const minX = Math.min(...boxes.map((b) => b.x0))
  const maxX = Math.max(...boxes.map((b) => b.x1))
  const width = Math.max(1, maxX - minX)

  const splits = panelSplits(boxes, width)
  if (splits.length === 0) return groupRows(boxes)

  // パネルごとに分けて行復元し、左パネル→右パネルの順に連結
  const panels: B[][] = Array.from({ length: splits.length + 1 }, () => [])
  for (const b of boxes) panels[panelIndex(b.cx, splits)].push(b)
  return panels.flatMap((p) => groupRows(p))
}
