// extract ロジックの検証用フィクスチャ（匿名化済みの数値のみ。氏名・ID・日付などの識別子は含めない）。
// 向きが正しく直った想定の行を流し込み、抽出と判定を確認する。
import { extractLabValues } from '../src/parse/extract.ts'

const sample = [
  '総ビリルビン 0.2 0.2~1.2',
  '総蛋白 7.2 6.5~8.3',
  'AST(GOT) 22 8~38',
  'ALT(GPT) 10 4~43',
  'CK(CPK) 71 30~172',
  '総コレステロール 192 130~219',
  '中性脂肪(TG) 58 30~149',
  'ナトリウム 141 135~150',
  'クロール 106 98~110',
  'カリウム 4.4 3.5~5.3',
  'クレアチニン 0.65 0.47~0.79',
  'eGFR 64.2 60.0以上',
  '尿酸 3.7 2.3~7.0',
  '血糖 87 60~109',
  'CRP定量 0.05以下 0.30以下',
  '白血球数 60 35~91',
  '赤血球数 283 376~500',
  'ヘモグロビン量 7.5 11.3~15.2',
  'ヘマトクリット値 25.3 33.4~44.9',
  'MCV 89.4 79.0~100.0',
  'MCH 26.5 26.3~34.3',
  'MCHC 29.6 30.7~36.6',
  '血小板数 38.1 13.0~36.9',
  '好中球 75.4 44.0~72.0',
  '好酸球 2.3 0.0~10.0',
  '好塩基球 0.3 0.0~3.0',
  'リンパ球 16.7 18.0~59.0',
  '単球 5.3 0.0~12.0',
  'HbA1c NGSP 6.1 4.6~6.2',
  'TSH 3.31 0.54~4.54',
  'Free T4 1.24 0.97~1.72',
  '血液一般検査', // ヘッダ（数字なし）
  '上記のとおりご報告致します。', // 文章ノイズ
]

const { values, unmatchedLines } = extractLabValues(sample, 'female')
let high = 0, low = 0
for (const v of values) {
  const mark = v.flag === 'high' ? '↑' : v.flag === 'low' ? '↓' : v.flag === 'normal' ? '・' : '?'
  if (v.flag === 'high') high++
  if (v.flag === 'low') low++
  console.log(`${mark} ${v.displayName.padEnd(20)} ${String(v.value).padStart(7)}  [${v.usedRange?.low ?? ''}-${v.usedRange?.high ?? ''} ${v.usedRange?.source}]`)
}
console.log(`\n読み取り項目数: ${values.length} / 入力 ${sample.length} 行 (高め=${high}, 低め=${low})`)
console.log('未マッチ行:', unmatchedLines)
