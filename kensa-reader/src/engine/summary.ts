// LabValue[] から、やさしい日本語の全体サマリを決定論的に生成する。
// 断定を避け、必ず「医師に相談を」で締める。
import type { LabValue } from './types'

export function buildSummary(values: LabValue[]): string {
  const measured = values.filter((v) => v.value !== null)
  if (measured.length === 0) {
    return '今回の写真からは、検査の数値をうまく読み取れませんでした。明るい場所で、表がまっすぐ大きく写るように撮り直すと読み取りやすくなります。'
  }

  const highs = measured.filter((v) => v.flag === 'high')
  const lows = measured.filter((v) => v.flag === 'low')
  const normals = measured.filter((v) => v.flag === 'normal')

  const parts: string[] = []
  parts.push(`${measured.length}個の項目を読み取りました。`)

  if (highs.length === 0 && lows.length === 0) {
    parts.push('読み取れた範囲では、基準値の中におさまっている項目が多いようです。')
  } else {
    if (normals.length > 0) parts.push(`${normals.length}個は基準値の範囲内でした。`)
    if (highs.length > 0) {
      const names = highs.map((v) => v.displayName).slice(0, 6).join('、')
      parts.push(`基準値より高めの項目: ${names}${highs.length > 6 ? ' ほか' : ''}。`)
    }
    if (lows.length > 0) {
      const names = lows.map((v) => v.displayName).slice(0, 6).join('、')
      parts.push(`基準値より低めの項目: ${names}${lows.length > 6 ? ' ほか' : ''}。`)
    }
    parts.push('基準値から外れていても、すぐに病気とは限りません。体質・食事・測定方法でも変わります。')
  }

  parts.push('この結果は参考情報です。気になる点は、検査を受けた医療機関や主治医に必ずご相談ください。')
  return parts.join(' ')
}
