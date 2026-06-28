// 外部エンジン（Claude / Ollama）が返した「項目・数値」を、
// 内蔵ナレッジに通して flag・説明・採用基準値を決定論的に付与する共通ロジック。
import { rangeForSex, type Sex } from '../knowledge/bloodTests'
import { lookupItem } from '../parse/extract'
import type { Flag, LabValue } from './types'

export interface RawItem {
  name: string
  value: number | null
  unit?: string
  refLow?: number | null
  refHigh?: number | null
}

function flagOf(value: number, low?: number, high?: number): Flag {
  if (low === undefined && high === undefined) return 'unknown'
  if (low !== undefined && value < low) return 'low'
  if (high !== undefined && value > high) return 'high'
  return 'normal'
}

export function mapRawItems(items: RawItem[], sex: Sex): LabValue[] {
  const out: LabValue[] = []
  for (const it of items) {
    if (it.value === null || !Number.isFinite(it.value)) continue
    const kb = lookupItem(it.name)
    const printed =
      it.refLow != null || it.refHigh != null
        ? { low: it.refLow ?? undefined, high: it.refHigh ?? undefined, text: `${it.refLow ?? ''}-${it.refHigh ?? ''}` }
        : undefined

    let used: LabValue['usedRange']
    if (printed) {
      used = { low: printed.low, high: printed.high, source: 'printed' }
    } else if (kb) {
      const r = rangeForSex(kb, sex)
      used = { low: r.low, high: r.high, source: 'knowledge' }
    }

    const flag = used ? flagOf(it.value, used.low, used.high) : 'unknown'
    const flagMeaning =
      flag === 'high' ? kb?.highMeans : flag === 'low' ? kb?.lowMeans : undefined

    out.push({
      rawName: it.name,
      itemId: kb?.id,
      displayName: kb?.displayName ?? it.name,
      category: kb?.category,
      value: it.value,
      unit: it.unit ?? kb?.unit,
      printedRange: printed,
      usedRange: used,
      flag,
      about: kb?.about,
      flagMeaning,
      confidence: kb ? 0.9 : 0.6,
    })
  }
  return out
}
