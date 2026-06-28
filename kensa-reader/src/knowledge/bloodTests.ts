// 血液検査ナレッジベース
// ------------------------------------------------------------------
// ここに含む基準値（参考値）は一般的な成人の目安です。
// ★重要: 基準値は検査機関・測定方法・年齢・性別で異なります。
//   検査用紙に「基準値 / 基準範囲」が印字されている場合は、必ずそちらを優先します
//   （アプリ側でも印字された基準値を読み取れたらそれを採用します）。
// 説明文は「やさしい言葉」での一般的な意味であり、診断ではありません。
// ------------------------------------------------------------------

export type Sex = 'male' | 'female' | 'unknown'

export interface RefRange {
  low?: number
  high?: number
}

export interface BloodTestItem {
  id: string
  /** 表示名（日本語・短い） */
  displayName: string
  /** 検査用紙やスクショに現れうる別名・略語・英語・OCRゆれ。小文字で照合。 */
  aliases: string[]
  /** 単位（表示用） */
  unit?: string
  /** カテゴリ（グループ表示用） */
  category: '血球' | '肝臓' | '腎臓' | '脂質' | '糖' | '炎症' | '電解質' | 'その他'
  /** 一般的な参考基準値。性差がある項目は male/female を使用。 */
  ref: RefRange | { male: RefRange; female: RefRange }
  /** この項目は何を見ているか（やさしい一言） */
  about: string
  /** 数値が高いときの一般的な意味（断定しない） */
  highMeans?: string
  /** 数値が低いときの一般的な意味（断定しない） */
  lowMeans?: string
}

export function rangeForSex(item: BloodTestItem, sex: Sex): RefRange {
  const ref = item.ref as RefRange | { male: RefRange; female: RefRange }
  if ('male' in ref) {
    if (sex === 'female') return ref.female
    return ref.male // 不明時は男性側を仮置き（UIで性別選択を促す）
  }
  return ref
}

export const BLOOD_TESTS: BloodTestItem[] = [
  // ---- 血球（血算 / CBC） -------------------------------------------------
  {
    id: 'wbc', displayName: '白血球数 (WBC)', category: '血球',
    aliases: ['wbc', 'wbc count', 'white blood cell', 'leukocyte', '白血球', '白血球数', '白血球数(wbc)'],
    unit: '/μL',
    ref: { low: 3300, high: 8600 },
    about: 'からだを細菌やウイルスから守る細胞の数です。',
    highMeans: '感染症や炎症、ストレスなどで増えることがあります。',
    lowMeans: '一部のウイルス感染やお薬の影響などで減ることがあります。',
  },
  {
    id: 'rbc', displayName: '赤血球数 (RBC)', category: '血球',
    aliases: ['rbc', 'rbc count', 'red blood cell', 'erythrocyte', '赤血球', '赤血球数', '赤血球数(rbc)'],
    unit: '万/μL',
    ref: { male: { low: 435, high: 555 }, female: { low: 386, high: 492 } },
    about: '酸素を全身に運ぶ細胞の数です。',
    highMeans: '脱水や喫煙などで見かけ上高くなることがあります。',
    lowMeans: '貧血のときに低くなることがあります。',
  },
  {
    id: 'hb', displayName: 'ヘモグロビン (Hb)', category: '血球',
    aliases: ['hb', 'hgb', 'hgb.', 'hemoglobin', 'haemoglobin', 'ヘモグロビン', '血色素', '血色素量'],
    unit: 'g/dL',
    ref: { male: { low: 13.7, high: 16.8 }, female: { low: 11.6, high: 14.8 } },
    about: '赤血球の中で酸素を運ぶ成分の量です。貧血の目安になります。',
    highMeans: '脱水や多血症などで高くなることがあります。',
    lowMeans: '貧血のときに低くなります。だるさ・息切れと関係することがあります。',
  },
  {
    id: 'ht', displayName: 'ヘマトクリット (Ht)', category: '血球',
    aliases: ['ht', 'hct', 'hematocrit', 'haematocrit', 'ヘマトクリット'],
    unit: '%',
    ref: { male: { low: 40.7, high: 50.1 }, female: { low: 35.1, high: 44.4 } },
    about: '血液全体のうち赤血球が占める割合です。',
    highMeans: '脱水などで高くなることがあります。',
    lowMeans: '貧血のときに低くなることがあります。',
  },
  {
    id: 'plt', displayName: '血小板数 (PLT)', category: '血球',
    aliases: ['plt', 'platelet', 'platelets', 'platelet count', '血小板', '血小板数'],
    unit: '万/μL',
    ref: { low: 15.8, high: 34.8 },
    about: '出血を止めるはたらきをする細胞の数です。',
    highMeans: '炎症などで増えることがあります。',
    lowMeans: '少ないと出血しやすくなることがあります。',
  },

  // ---- 肝臓 ---------------------------------------------------------------
  {
    id: 'ast', displayName: 'AST (GOT)', category: '肝臓',
    aliases: ['ast', 'got', 'sgot', 'ast(got)', 'got(ast)', 'ast (got)'],
    unit: 'U/L',
    ref: { low: 13, high: 30 },
    about: '肝臓や筋肉に多い酵素です。肝臓の状態の目安になります。',
    highMeans: '肝臓や筋肉のダメージで高くなることがあります。',
  },
  {
    id: 'alt', displayName: 'ALT (GPT)', category: '肝臓',
    aliases: ['alt', 'gpt', 'sgpt', 'alt(gpt)', 'gpt(alt)', 'alt (gpt)'],
    unit: 'U/L',
    ref: { male: { low: 10, high: 42 }, female: { low: 7, high: 23 } },
    about: '主に肝臓に多い酵素です。肝臓のダメージの目安になります。',
    highMeans: '脂肪肝・肝炎・お薬の影響などで高くなることがあります。',
  },
  {
    id: 'ggt', displayName: 'γ-GTP (γ-GT)', category: '肝臓',
    aliases: ['γ-gtp', 'γ-gt', 'gamma-gtp', 'ggt', 'γgtp', 'r-gtp', 'γ‐gtp', 'ガンマgtp'],
    unit: 'U/L',
    ref: { male: { low: 13, high: 64 }, female: { low: 9, high: 32 } },
    about: 'お酒や胆道の影響を受けやすい肝臓の酵素です。',
    highMeans: '飲酒・脂肪肝・胆道の問題などで高くなることがあります。',
  },
  {
    id: 'alp', displayName: 'ALP', category: '肝臓',
    aliases: ['alp', 'アルカリホスファターゼ'],
    unit: 'U/L',
    ref: { low: 38, high: 113 }, // IFCC法の目安
    about: '肝臓・胆道・骨に関係する酵素です。',
    highMeans: '胆道や骨の状態で高くなることがあります（成長期の子どもは高めです）。',
  },
  {
    id: 'tbil', displayName: '総ビリルビン (T-Bil)', category: '肝臓',
    aliases: ['t-bil', 'tbil', 'total bilirubin', 'bilirubin', '総ビリルビン', 'ビリルビン', 't.bil'],
    unit: 'mg/dL',
    ref: { low: 0.4, high: 1.5 },
    about: '古くなった赤血球が分解されてできる黄色い色素です。',
    highMeans: '体質（体質性黄疸）や肝臓・胆道の影響で高くなることがあります。',
  },
  {
    id: 'ldh', displayName: 'LDH (LD)', category: '肝臓',
    aliases: ['ldh', 'ld', 'ldh(ld)'],
    unit: 'U/L',
    ref: { low: 124, high: 222 }, // IFCC法の目安
    about: 'からだの多くの細胞に含まれる酵素です。',
    highMeans: '細胞のダメージ全般で高くなることがあります。',
  },
  {
    id: 'tp', displayName: '総蛋白 (TP)', category: '肝臓',
    aliases: ['tp', 'total protein', '総蛋白', '総タンパク', '総蛋白質'],
    unit: 'g/dL',
    ref: { low: 6.6, high: 8.1 },
    about: '血液中のタンパク質の合計量です。栄養状態などの目安になります。',
    highMeans: '脱水などで高くなることがあります。',
    lowMeans: '栄養不足や肝臓・腎臓の影響で低くなることがあります。',
  },
  {
    id: 'alb', displayName: 'アルブミン (ALB)', category: '肝臓',
    aliases: ['alb', 'albumin', 'アルブミン'],
    unit: 'g/dL',
    ref: { low: 4.1, high: 5.1 },
    about: '血液中の主要なタンパク質で、栄養状態の目安になります。',
    lowMeans: '栄養不足や肝臓・腎臓の影響で低くなることがあります。',
  },

  // ---- 腎臓 ---------------------------------------------------------------
  {
    id: 'bun', displayName: '尿素窒素 (BUN)', category: '腎臓',
    aliases: ['bun', '尿素窒素', 'un', '尿素'],
    unit: 'mg/dL',
    ref: { low: 8, high: 20 },
    about: 'タンパク質が使われた後の老廃物で、腎臓のはたらきの目安になります。',
    highMeans: '腎臓の機能低下や脱水などで高くなることがあります。',
  },
  {
    id: 'cr', displayName: 'クレアチニン (Cr)', category: '腎臓',
    aliases: ['cr', 'cre', 'crea', 'クレアチニン', 'creatinine'],
    unit: 'mg/dL',
    ref: { male: { low: 0.65, high: 1.07 }, female: { low: 0.46, high: 0.79 } },
    about: '筋肉から出る老廃物で、腎臓のはたらきの目安になります。',
    highMeans: '腎臓の機能が下がると高くなることがあります。',
  },
  {
    id: 'egfr', displayName: 'eGFR', category: '腎臓',
    aliases: ['egfr', 'e-gfr', 'gfr', '推算gfr'],
    unit: 'mL/min/1.73m²',
    ref: { low: 60 }, // 60以上が目安。上限は設けない。
    about: '腎臓が老廃物をろ過する力の推定値です。高いほどよく、低いと注意です。',
    lowMeans: '60を下回る状態が続く場合は腎臓のはたらきに注意が必要なことがあります。',
  },
  {
    id: 'ua', displayName: '尿酸 (UA)', category: '腎臓',
    aliases: ['ua', '尿酸', 'uric acid'],
    unit: 'mg/dL',
    ref: { male: { low: 3.7, high: 7.0 }, female: { low: 2.6, high: 7.0 } },
    about: 'プリン体が分解されてできる物質です。高いと痛風と関係します。',
    highMeans: '7.0を超える状態が続くと痛風や結石と関係することがあります。',
  },

  // ---- 脂質 ---------------------------------------------------------------
  {
    id: 'tcho', displayName: '総コレステロール (T-Cho)', category: '脂質',
    aliases: ['t-cho', 'tcho', '総コレステロール', 'tc', 't.cho', 'total cholesterol'],
    unit: 'mg/dL',
    ref: { low: 142, high: 219 },
    about: '血液中のコレステロールの合計量です。',
    highMeans: '高い状態が続くと動脈硬化と関係することがあります。',
  },
  {
    id: 'ldl', displayName: 'LDLコレステロール', category: '脂質',
    aliases: ['ldl', 'ldl-c', 'ldlコレステロール', 'ldl-cho', '悪玉'],
    unit: 'mg/dL',
    ref: { low: 65, high: 139 },
    about: 'いわゆる「悪玉」コレステロールです。',
    highMeans: '高いと動脈硬化が進みやすいと言われます。',
  },
  {
    id: 'hdl', displayName: 'HDLコレステロール', category: '脂質',
    aliases: ['hdl', 'hdl-c', 'hdlコレステロール', 'hdl-cho', '善玉'],
    unit: 'mg/dL',
    ref: { low: 40, high: 96 },
    about: 'いわゆる「善玉」コレステロールです。高めがよいとされます。',
    lowMeans: '低いと動脈硬化のリスクと関係することがあります。',
  },
  {
    id: 'tg', displayName: '中性脂肪 (TG)', category: '脂質',
    aliases: ['tg', '中性脂肪', 'トリグリセリド', 'triglyceride', 'tg(中性脂肪)'],
    unit: 'mg/dL',
    ref: { low: 30, high: 149 },
    about: 'エネルギーとして使われる脂肪です。食後は高くなります。',
    highMeans: '食べ過ぎ・飲酒・肥満などで高くなることがあります。',
  },

  // ---- 糖 -----------------------------------------------------------------
  {
    id: 'glu', displayName: '血糖 (Glu)', category: '糖',
    aliases: ['glu', '血糖', '血糖値', 'glucose', 'bs', 'fbs', '空腹時血糖'],
    unit: 'mg/dL',
    ref: { low: 73, high: 109 }, // 空腹時の目安
    about: '血液中のブドウ糖の量です（食事の影響を受けます）。',
    highMeans: '高い状態が続くと糖尿病と関係することがあります。',
    lowMeans: '低すぎると、ふらつき等の低血糖症状と関係することがあります。',
  },
  {
    id: 'hba1c', displayName: 'HbA1c', category: '糖',
    aliases: ['hba1c', 'a1c', 'ヘモグロビンa1c', 'hba1c(ngsp)', 'グリコヘモグロビン'],
    unit: '%',
    ref: { low: 4.6, high: 6.2 }, // NGSP
    about: '過去1〜2か月の血糖の平均的な高さを表します。',
    highMeans: '6.5%以上は糖尿病の目安とされます（必ず医師の判断が必要です）。',
  },

  // ---- 炎症 ---------------------------------------------------------------
  {
    id: 'crp', displayName: 'CRP', category: '炎症',
    aliases: ['crp', 'c反応性蛋白', 'c-反応性蛋白'],
    unit: 'mg/dL',
    ref: { high: 0.14 }, // 0.14以下が目安
    about: 'からだの炎症の強さを表す代表的な指標です。',
    highMeans: '感染症や炎症があると高くなります。',
  },

  // ---- 電解質 -------------------------------------------------------------
  {
    id: 'na', displayName: 'ナトリウム (Na)', category: '電解質',
    aliases: ['na', 'ナトリウム', 'sodium'],
    unit: 'mEq/L',
    ref: { low: 138, high: 145 },
    about: '体内の水分バランスに関わるミネラルです。',
  },
  {
    id: 'k', displayName: 'カリウム (K)', category: '電解質',
    aliases: ['k', 'カリウム', 'potassium'],
    unit: 'mEq/L',
    ref: { low: 3.6, high: 4.8 },
    about: '心臓や筋肉のはたらきに関わるミネラルです。',
    highMeans: '腎臓の影響などで高くなることがあり、注意が必要な場合があります。',
  },
  {
    id: 'cl', displayName: 'クロール (Cl)', category: '電解質',
    aliases: ['cl', 'クロール', 'chloride'],
    unit: 'mEq/L',
    ref: { low: 101, high: 108 },
    about: '体内の水分・酸とアルカリのバランスに関わるミネラルです。',
  },

  // ---- 血球（赤血球指数・白血球分画） -------------------------------------
  {
    id: 'mcv', displayName: 'MCV（赤血球の大きさ）', category: '血球',
    aliases: ['mcv'],
    unit: 'fL',
    ref: { low: 83.6, high: 98.2 },
    about: '赤血球1個の平均的な大きさです。貧血の種類を見分ける手がかりになります。',
    highMeans: '大きめの場合、ビタミンB12・葉酸の不足などと関係することがあります。',
    lowMeans: '小さめの場合、鉄分の不足（鉄欠乏性貧血）などと関係することがあります。',
  },
  {
    id: 'mch', displayName: 'MCH', category: '血球',
    aliases: ['mch'],
    unit: 'pg',
    ref: { low: 27.5, high: 33.2 },
    about: '赤血球1個に含まれるヘモグロビンの平均量です。',
  },
  {
    id: 'mchc', displayName: 'MCHC', category: '血球',
    aliases: ['mchc'],
    unit: '%',
    ref: { low: 31.7, high: 35.3 },
    about: '赤血球の中のヘモグロビンの濃さです。',
  },
  {
    id: 'neutro', displayName: '好中球', category: '血球',
    aliases: ['好中球', 'neutrophil', 'neutrophils', 'neut', 'segmenters', 'segmented neutrophils'],
    unit: '%',
    ref: { low: 40, high: 75 },
    about: '白血球の一種で、主に細菌と戦います（白血球の割合）。',
    highMeans: '細菌感染や炎症で増えることがあります。',
  },
  {
    id: 'lympho', displayName: 'リンパ球', category: '血球',
    aliases: ['リンパ球', 'lymphocyte', 'lymphocytes', 'lymph'],
    unit: '%',
    ref: { low: 18, high: 59 },
    about: '白血球の一種で、主にウイルスと戦います（白血球の割合）。',
  },
  {
    id: 'mono', displayName: '単球', category: '血球',
    aliases: ['単球', 'monocyte', 'monocytes'],
    unit: '%',
    ref: { low: 0, high: 12 },
    about: '白血球の一種で、古くなった細胞などを処理します（白血球の割合）。',
  },
  {
    id: 'eosino', displayName: '好酸球', category: '血球',
    aliases: ['好酸球', 'eosinophil', 'eosinophils', 'eos'],
    unit: '%',
    ref: { low: 0, high: 10 },
    about: '白血球の一種で、アレルギーや寄生虫と関係します（白血球の割合）。',
  },
  {
    id: 'baso', displayName: '好塩基球', category: '血球',
    aliases: ['好塩基球', 'basophil', 'basophils', 'baso'],
    unit: '%',
    ref: { low: 0, high: 3 },
    about: '白血球の一種で、アレルギー反応に関わります（白血球の割合）。',
  },

  // ---- その他（鉄・筋・甲状腺） -------------------------------------------
  {
    id: 'fe', displayName: '血清鉄 (Fe)', category: 'その他',
    aliases: ['血清鉄', 'fe', 'iron', 'serum iron', '鉄'],
    unit: 'μg/dL',
    ref: { low: 48, high: 170 },
    about: '血液中の鉄の量です。貧血の原因を調べる手がかりになります。',
    lowMeans: '鉄が不足する貧血（鉄欠乏性貧血）のときに低くなることがあります。',
  },
  {
    id: 'ferritin', displayName: 'フェリチン', category: 'その他',
    aliases: ['フェリチン', 'ferritin'],
    unit: 'ng/mL',
    ref: { low: 4, high: 120 },
    about: 'からだに蓄えられた鉄の量を反映します。鉄不足の早期の目安になります。',
    lowMeans: '低いと、からだの鉄の蓄えが少ない状態（鉄欠乏）を示すことがあります。',
  },
  {
    id: 'ck', displayName: 'CK (CPK)', category: 'その他',
    aliases: ['ck', 'cpk', 'ck(cpk)', 'cpk(ck)', 'ck (cpk)'],
    unit: 'U/L',
    ref: { male: { low: 59, high: 248 }, female: { low: 41, high: 153 } },
    about: '主に筋肉に多い酵素です。筋肉の状態の目安になります。',
    highMeans: '運動のあとや筋肉のダメージで高くなることがあります。',
  },
  {
    id: 'tsh', displayName: 'TSH（甲状腺刺激ホルモン）', category: 'その他',
    aliases: ['tsh'],
    unit: 'μIU/mL',
    ref: { low: 0.5, high: 5.0 },
    about: '甲状腺のはたらきを調整するホルモンです。',
    highMeans: '甲状腺のはたらきが低めのときに高くなることがあります。',
    lowMeans: '甲状腺のはたらきが高めのときに低くなることがあります。',
  },
  {
    id: 'ft4', displayName: 'FT4（遊離サイロキシン）', category: 'その他',
    aliases: ['ft4', 'free t4', 'free t', 'f-t4', '遊離サイロキシン'],
    unit: 'ng/dL',
    ref: { low: 0.9, high: 1.7 },
    about: '甲状腺ホルモンの一つです。甲状腺の状態の目安になります。',
  },
]

/** alias 照合のための索引（小文字キー → 項目） */
export const ALIAS_INDEX: Map<string, BloodTestItem> = (() => {
  const m = new Map<string, BloodTestItem>()
  for (const item of BLOOD_TESTS) {
    for (const a of item.aliases) m.set(a.toLowerCase(), item)
    m.set(item.displayName.toLowerCase(), item)
  }
  return m
})()
