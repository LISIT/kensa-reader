// extract ロジックの簡易テスト。esbuild でバンドルして node 実行する。
import { extractLabValues } from '../src/parse/extract.ts'

const sample = [
  'ALT (GPT)    35    7-38   U/L',
  'AST(GOT)     52    13-30  U/L',
  'γ-GTP        120   13-64  U/L',
  'WBC          5400  3300-8600  /μL',
  'Hb           10.2  13.7-16.8  g/dL',
  'LDL          165   65-139 mg/dL',
  'HbA1c        6.8   4.6-6.2 %',
  'Na           140',
  '中性脂肪 TG   210   30-149 mg/dL',
  'ごあいさつ いつもありがとうございます', // ノイズ行
]

const { values, unmatchedLines } = extractLabValues(sample, 'male')
for (const v of values) {
  console.log(
    `${v.displayName.padEnd(16)} value=${v.value}  flag=${v.flag}  range=${v.usedRange?.low}-${v.usedRange?.high}(${v.usedRange?.source})`,
  )
}
console.log('--- unmatched ---')
console.log(unmatchedLines)
console.log(`\n読み取り項目数: ${values.length}`)
