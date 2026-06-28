// OCRテキスト → 構造化された検査値（LabValue[]）への抽出。
// 血液検査表は「項目名  数値  基準値  単位」の行が多いことを利用する。
// ★用紙に印字された基準値が読み取れたら、それを判定に優先採用する。

import { ALIAS_INDEX, BLOOD_TESTS, rangeForSex, type BloodTestItem, type Sex } from '../knowledge/bloodTests'
import type { Flag, LabValue } from '../engine/types'

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** 全角英数記号→半角、各種ダッシュ/チルダの統一、桁区切りカンマ除去 */
function normalizeLine(input: string): string {
  let s = input.replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
  s = s.replace(/　/g, ' ')
  s = s.replace(/[‐‑‒–—―ー−~〜]/g, '-') // ダッシュ/長音/チルダを '-' に統一
  s = s.replace(/(\d),(\d{3})/g, '$1$2') // 5,400 -> 5400
  s = s.replace(/\s+/g, ' ').trim()
  return s
}

const isAscii = (s: string) => /^[\x00-\x7F]+$/.test(s)

interface AliasMatcher {
  item: BloodTestItem
  alias: string
  re: RegExp
}

const MATCHERS: AliasMatcher[] = (() => {
  const list: AliasMatcher[] = []
  for (const item of BLOOD_TESTS) {
    const aliases = [...item.aliases, item.displayName]
    for (const alias of aliases) {
      const esc = escapeRegExp(alias.toLowerCase())
      const re = isAscii(alias)
        ? new RegExp(`(?<![a-z0-9])${esc}(?![a-z0-9])`, 'i')
        : new RegExp(esc, 'i')
      list.push({ item, alias: alias.toLowerCase(), re })
    }
  }
  // 長いaliasを優先（"hba1c" を "hb" より先に）
  list.sort((a, b) => b.alias.length - a.alias.length)
  return list
})()

const RANGE_RE = /(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)/
const NUM_RE = /-?\d+(?:\.\d+)?/

function flagOf(value: number, low?: number, high?: number): Flag {
  if (low === undefined && high === undefined) return 'unknown'
  if (low !== undefined && value < low) return 'low'
  if (high !== undefined && value > high) return 'high'
  return 'normal'
}

interface LineMatch {
  item: BloodTestItem
  startIndex: number
  rest: string // alias より後ろの文字列
}

function matchLine(norm: string): LineMatch | null {
  const lower = norm.toLowerCase()
  let best: LineMatch | null = null
  for (const m of MATCHERS) {
    const found = m.re.exec(lower)
    if (!found) continue
    const start = found.index
    // 行頭に近い（=ラベル位置の）一致を採用
    if (best === null || start < best.startIndex) {
      best = { item: m.item, startIndex: start, rest: norm.slice(start + found[0].length) }
    }
  }
  return best
}

export interface ExtractResult {
  values: LabValue[]
  unmatchedLines: string[]
}

export function extractLabValues(lines: string[], sex: Sex): ExtractResult {
  const values: LabValue[] = []
  const seen = new Set<string>()
  const unmatched: string[] = []

  for (const raw of lines) {
    const norm = normalizeLine(raw)
    if (!norm || !/\d/.test(norm)) continue

    const m = matchLine(norm)
    if (!m) {
      if (norm.length > 2) unmatched.push(norm)
      continue
    }
    if (seen.has(m.item.id)) continue // 同一項目は最初の一致のみ

    let rest = m.rest

    // 1) 印字された基準値（範囲）を先に抜き、本文から除去
    let printedRange: LabValue['printedRange']
    const rangeM = RANGE_RE.exec(rest)
    if (rangeM) {
      const lo = parseFloat(rangeM[1])
      const hi = parseFloat(rangeM[2])
      if (Number.isFinite(lo) && Number.isFinite(hi) && lo <= hi) {
        printedRange = { low: lo, high: hi, text: `${rangeM[1]}-${rangeM[2]}` }
        rest = rest.slice(0, rangeM.index) + ' ' + rest.slice(rangeM.index + rangeM[0].length)
      }
    }

    // 2) 残りから測定値（最初の数値）
    const numM = NUM_RE.exec(rest)
    const value = numM ? parseFloat(numM[0]) : null
    if (value === null || !Number.isFinite(value)) {
      unmatched.push(norm)
      continue
    }
    seen.add(m.item.id)

    // 3) 採用する基準値を決定（印字 > ナレッジ）
    const kbRange = rangeForSex(m.item, sex)
    const used = printedRange
      ? { low: printedRange.low, high: printedRange.high, source: 'printed' as const }
      : { low: kbRange.low, high: kbRange.high, source: 'knowledge' as const }

    const flag = flagOf(value, used.low, used.high)
    const flagMeaning =
      flag === 'high' ? m.item.highMeans : flag === 'low' ? m.item.lowMeans : undefined

    values.push({
      rawName: norm.slice(0, m.startIndex + 1).trim() || m.item.displayName,
      itemId: m.item.id,
      displayName: m.item.displayName,
      category: m.item.category,
      value,
      unit: m.item.unit,
      printedRange,
      usedRange: used,
      flag,
      about: m.item.about,
      flagMeaning,
      confidence: printedRange ? 0.85 : 0.7,
    })
  }

  return { values, unmatchedLines: unmatched }
}

/** alias から既知項目を引く（外部エンジンの構造化出力の補正に使用） */
export function lookupItem(name: string): BloodTestItem | undefined {
  return ALIAS_INDEX.get(name.trim().toLowerCase())
}
