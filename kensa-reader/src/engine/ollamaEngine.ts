// 任意の上位エンジン: ローカル Ollama (MedGemma 等の vision モデル)。
// 完全ローカル・外部送信なし。自宅PCで Ollama を起動している人向け。
import { buildSummary } from './summary'
import { mapRawItems, type RawItem } from './structuredMap'
import type { AnalysisResult, AnalyzeOptions, Engine } from './types'
import { loadSettings } from './settings'

const PROMPT = `この画像は日本の血液検査の結果です。表の検査項目を読み取り、次のJSONのみを返してください。
{"items":[{"name":"項目名","value":数値またはnull,"unit":"単位","refLow":下限またはnull,"refHigh":上限またはnull}],"summary":"やさしい日本語の要約"}
診断名は書かない。JSON以外は出力しない。`

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer()
  const bytes = new Uint8Array(buf)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

function parseItems(text: string): { items: RawItem[]; summary?: string } {
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

export const ollamaEngine: Engine = {
  id: 'ollama',
  label: 'ローカル Ollama（送信なし・要サーバ）',
  requiresSetup: true,

  async isAvailable() {
    const { url } = loadSettings().ollama
    try {
      const res = await fetch(`${url}/api/tags`, { method: 'GET' })
      return res.ok
    } catch {
      return false
    }
  },

  async analyzeBloodTest(image: Blob, opts: AnalyzeOptions): Promise<AnalysisResult> {
    const { sex, onProgress } = opts
    const { url, model } = loadSettings().ollama
    onProgress?.(0.1, '画像を準備しています…')
    const b64 = await blobToBase64(image)

    onProgress?.(0.3, 'ローカルモデルが読み取っています…')
    const res = await fetch(`${url}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        format: 'json',
        messages: [{ role: 'user', content: PROMPT, images: [b64] }],
      }),
    })
    if (!res.ok) {
      throw new Error(`Ollama エラー (${res.status})。サーバ起動とモデル名をご確認ください。`)
    }
    const json = await res.json()
    const text: string = json.message?.content ?? ''
    onProgress?.(0.8, '内容を整理しています…')

    const { items, summary } = parseItems(text)
    const values = mapRawItems(items, sex)
    const warnings: string[] = []
    if (values.length === 0) warnings.push('検査項目を読み取れませんでした。既定エンジンもお試しください。')

    onProgress?.(1, '完了')
    const tail = '\n\nこの結果は参考情報です。気になる点は、主治医に必ずご相談ください。'
    return {
      engineId: this.id,
      engineLabel: this.label,
      sex,
      values,
      summary: summary?.trim() ? summary.trim() + tail : buildSummary(values),
      warnings,
      rawText: text,
    }
  },
}
