// 任意の上位エンジン: Claude (vision)。
// 雑なスマホ写真のOCRに強い。判定は内蔵ナレッジで決定論的に行うハイブリッド。
// ★APIキーは端末内のみに保存。画像は Anthropic に送信されます（設定で明示同意した人向け）。
import { buildSummary } from './summary'
import { mapRawItems, type RawItem } from './structuredMap'
import type { AnalysisResult, AnalyzeOptions, Engine } from './types'
import { loadSettings } from './settings'

const ENDPOINT = 'https://api.anthropic.com/v1/messages'

const PROMPT = `あなたは血液検査結果の読み取りを助けるアシスタントです。
この画像は、日本の血液検査の結果（紙やスクリーンショット）です。
表に含まれる検査項目を、できるだけ正確に読み取り、次のJSONだけを返してください（前後の説明文は不要）。

{
  "items": [
    { "name": "項目名(用紙の表記そのまま。例: ALT(GPT), WBC, γ-GTP)",
      "value": 数値(単位は含めない。読めなければ null),
      "unit": "単位(あれば。なければ空文字)",
      "refLow": 用紙に印字された基準値の下限(数値。なければ null),
      "refHigh": 用紙に印字された基準値の上限(数値。なければ null) }
  ],
  "summary": "やさしい日本語で全体の要約（断定しない。最後に必ず『気になる点は主治医に相談を』と添える）"
}

注意:
- 診断名は書かない。あくまで読み取りと一般的な説明にとどめる。
- 数値が曖昧な項目は value を null にする。
- JSON以外は出力しない。`

async function blobToBase64(blob: Blob): Promise<{ data: string; mediaType: string }> {
  const buf = await blob.arrayBuffer()
  const bytes = new Uint8Array(buf)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  const data = btoa(bin)
  const mediaType = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg'
  return { data, mediaType }
}

function extractJson(text: string): { items: RawItem[]; summary?: string } {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) return { items: [] }
  const parsed = JSON.parse(text.slice(start, end + 1))
  const items: RawItem[] = Array.isArray(parsed.items)
    ? parsed.items.map((i: Record<string, unknown>) => ({
        name: String(i.name ?? ''),
        value: typeof i.value === 'number' ? i.value : i.value == null ? null : parseFloat(String(i.value)),
        unit: i.unit ? String(i.unit) : undefined,
        refLow: typeof i.refLow === 'number' ? i.refLow : null,
        refHigh: typeof i.refHigh === 'number' ? i.refHigh : null,
      }))
    : []
  return { items, summary: typeof parsed.summary === 'string' ? parsed.summary : undefined }
}

export const claudeEngine: Engine = {
  id: 'claude',
  label: 'Claude（高精度・要APIキー・画像を送信）',
  requiresSetup: true,

  async isAvailable() {
    return Boolean(loadSettings().claude.apiKey)
  },

  async analyzeBloodTest(image: Blob, opts: AnalyzeOptions): Promise<AnalysisResult> {
    const { sex, onProgress } = opts
    const { apiKey, model } = loadSettings().claude
    if (!apiKey) throw new Error('Claude の APIキーが設定されていません。設定画面で入力してください。')

    onProgress?.(0.1, '画像を準備しています…')
    const { data, mediaType } = await blobToBase64(image)

    onProgress?.(0.3, 'Claude が読み取っています…')
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
              { type: 'text', text: PROMPT },
            ],
          },
        ],
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`Claude API エラー (${res.status})。キーやモデル名をご確認ください。${body.slice(0, 200)}`)
    }

    const json = await res.json()
    const text: string = (json.content ?? []).map((c: { text?: string }) => c.text ?? '').join('')
    onProgress?.(0.8, '内容を整理しています…')

    const { items, summary } = extractJson(text)
    const values = mapRawItems(items, sex)

    const warnings: string[] = []
    if (values.some((v) => v.usedRange?.source === 'knowledge')) {
      warnings.push('一部の基準値は一般的な目安を使っています。用紙の基準値・主治医の説明を優先してください。')
    }
    if (values.length === 0) warnings.push('検査項目を読み取れませんでした。別の写真でお試しください。')

    onProgress?.(1, '完了')

    const tail = '\n\nこの結果は参考情報です。気になる点は、検査を受けた医療機関や主治医に必ずご相談ください。'
    return {
      engineId: this.id,
      engineLabel: this.label,
      sex,
      values,
      summary: (summary?.trim() ? summary.trim() + tail : buildSummary(values)),
      warnings,
      rawText: text,
    }
  },
}
