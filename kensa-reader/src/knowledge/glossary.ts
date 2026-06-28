// 用語・略語のやさしい辞書（タップで解説）
// 診断ではなく、一般的な意味の説明です。

export interface GlossaryEntry {
  term: string
  aliases?: string[]
  plain: string
}

export const GLOSSARY: GlossaryEntry[] = [
  { term: '基準値', plain: '「だいたいこの範囲なら一般的」という目安の範囲です。検査機関によって少しずつ違います。' },
  { term: '基準範囲', aliases: ['基準値'], plain: '健康な多くの人がおさまる数値の範囲のことです。' },
  { term: 'U/L', plain: '酵素などの量をあらわす単位です（1リットルあたりの活性の単位）。' },
  { term: 'mg/dL', plain: '濃度の単位で、100mL(=1dL)の血液に何ミリグラム含まれるかを表します。' },
  { term: 'g/dL', plain: '濃度の単位で、100mLの血液に何グラム含まれるかを表します。' },
  { term: 'mEq/L', plain: 'ミネラル（電解質）の量をあらわす単位です。' },
  { term: 'WBC', aliases: ['白血球'], plain: '白血球。からだを感染から守る細胞です。' },
  { term: 'RBC', aliases: ['赤血球'], plain: '赤血球。酸素を運ぶ細胞です。' },
  { term: 'Hb', aliases: ['ヘモグロビン', '血色素'], plain: '赤血球の中で酸素を運ぶ成分。貧血の目安です。' },
  { term: 'PLT', aliases: ['血小板'], plain: '出血を止める細胞です。' },
  { term: 'AST', aliases: ['GOT'], plain: '肝臓や筋肉に多い酵素。肝臓の状態の目安です。' },
  { term: 'ALT', aliases: ['GPT'], plain: '主に肝臓にある酵素。肝臓のダメージの目安です。' },
  { term: 'γ-GTP', aliases: ['ggt', 'γ-gt'], plain: 'お酒や胆道の影響を受けやすい肝臓の酵素です。' },
  { term: 'BUN', aliases: ['尿素窒素'], plain: 'タンパク質の老廃物。腎臓のはたらきの目安です。' },
  { term: 'Cr', aliases: ['クレアチニン'], plain: '筋肉から出る老廃物。腎臓のはたらきの目安です。' },
  { term: 'eGFR', plain: '腎臓が老廃物をこしとる力の推定値。高いほどよい指標です。' },
  { term: 'LDL', plain: 'いわゆる「悪玉」コレステロール。高いと動脈硬化と関係します。' },
  { term: 'HDL', plain: 'いわゆる「善玉」コレステロール。高めがよいとされます。' },
  { term: 'TG', aliases: ['中性脂肪'], plain: 'エネルギーになる脂肪。食後は高くなります。' },
  { term: 'HbA1c', plain: '過去1〜2か月の血糖の平均的な高さを表す指標です。' },
  { term: 'CRP', plain: 'からだの炎症の強さを表す指標です。' },
]

export const GLOSSARY_INDEX: Map<string, GlossaryEntry> = (() => {
  const m = new Map<string, GlossaryEntry>()
  for (const e of GLOSSARY) {
    m.set(e.term.toLowerCase(), e)
    for (const a of e.aliases ?? []) m.set(a.toLowerCase(), e)
  }
  return m
})()

export function lookupGlossary(term: string): GlossaryEntry | undefined {
  return GLOSSARY_INDEX.get(term.trim().toLowerCase())
}
