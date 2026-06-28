// 手入力補助のロジック：OCRで読めた値の修正・読めない項目の追加を、
// 内蔵ナレッジで再判定（flag/説明）してレポートを作り直す。
import { BLOOD_TESTS, rangeForSex, type BloodTestItem, type Sex } from '../knowledge/bloodTests'
import { buildSummary } from './summary'
import type { AnalysisResult, Flag, LabValue } from './types'

function itemById(id?: string): BloodTestItem | undefined {
  if (!id) return undefined
  return BLOOD_TESTS.find((b) => b.id === id)
}

function flagOf(value: number, low?: number, high?: number): Flag {
  if (low === undefined && high === undefined) return 'unknown'
  if (low !== undefined && value < low) return 'low'
  if (high !== undefined && value > high) return 'high'
  return 'normal'
}

/** 値を更新し、基準値(印字優先／無ければナレッジ)で flag と説明を再計算 */
export function recomputeValue(v: LabValue, value: number, sex: Sex): LabValue {
  const item = itemById(v.itemId)
  let used = v.usedRange
  if (!used && item) {
    const r = rangeForSex(item, sex)
    used = { low: r.low, high: r.high, source: 'knowledge' }
  }
  const flag = used ? flagOf(value, used.low, used.high) : 'unknown'
  const flagMeaning = flag === 'high' ? item?.highMeans : flag === 'low' ? item?.lowMeans : undefined
  return { ...v, value, usedRange: used, flag, flagMeaning }
}

/** ナレッジ項目IDから手入力の LabValue を作る */
export function createManualValue(itemId: string, value: number, sex: Sex): LabValue | null {
  const item = itemById(itemId)
  if (!item) return null
  const r = rangeForSex(item, sex)
  const used = { low: r.low, high: r.high, source: 'knowledge' as const }
  const flag = flagOf(value, used.low, used.high)
  const flagMeaning = flag === 'high' ? item.highMeans : flag === 'low' ? item.lowMeans : undefined
  return {
    rawName: item.displayName,
    itemId: item.id,
    displayName: item.displayName,
    category: item.category,
    value,
    unit: item.unit,
    usedRange: used,
    flag,
    about: item.about,
    flagMeaning,
    confidence: 1, // 手入力＝確実
  }
}

/** 編集後の値配列から AnalysisResult を作り直す（サマリ再生成） */
export function rebuildResult(base: AnalysisResult, values: LabValue[]): AnalysisResult {
  const warnings = base.warnings.filter((w) => !w.startsWith('【診断情報】'))
  return { ...base, values, summary: buildSummary(values), warnings }
}

/** まだ結果に無い、追加候補の項目一覧（カテゴリ順） */
export function addableItems(values: LabValue[]): BloodTestItem[] {
  const have = new Set(values.map((v) => v.itemId).filter(Boolean))
  return BLOOD_TESTS.filter((b) => !have.has(b.id))
}
