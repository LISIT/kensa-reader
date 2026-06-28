// PaddleOCR プロバイダ（本命 / primary）。@gutenye/ocr-browser + onnxruntime-web。
// 端末内・無料・キー不要。WebGPU(対応端末)優先、未対応は wasm。
// モデルは CDN(jsdelivr) から取得し PWA でキャッシュ。ユーザーの画像は送信しない。
//
// ★現状の既定モデルは PP-OCRv4 ch/en（漢字・数字・英字に強い）。
//   日本語のカタカナ（ヘモグロビン等）は japan 認識モデルが必要。
//   PADDLE_MODELS.recognitionPath / dictionaryPath を japan 版に差し替えれば対応可能（TODO）。
import type { OcrLine, OcrProvider, OcrRecognizeOptions, OcrResult } from './types'
import { canvasToUrl } from './preprocess'

// ★onnxruntime-web / @gutenye/ocr-browser は巨大(wasm 26MB)なので **バンドルせず実行時にCDNから取得**する。
//   こうするとアプリ本体は軽量のまま、PaddleOCR選択時だけダウンロード（PWAでキャッシュ）。
const OCR_BROWSER_CDN = 'https://esm.sh/@gutenye/ocr-browser@1.4.8?bundle'

// PaddleOCR モデル（@gutenye/ocr-models, jsdelivr）
const MODELS_BASE = 'https://cdn.jsdelivr.net/npm/@gutenye/ocr-models@1.4.2/assets/'
export const PADDLE_MODELS = {
  detectionPath: `${MODELS_BASE}ch_PP-OCRv4_det_infer.onnx`,
  recognitionPath: `${MODELS_BASE}ch_PP-OCRv4_rec_infer.onnx`,
  dictionaryPath: `${MODELS_BASE}ppocr_keys_v1.txt`,
}

interface GLine {
  text: string
  mean?: number
  box?: number[][]
}

let ocrInstance: { detect: (url: string) => Promise<GLine[]> } | null = null
let initPromise: Promise<typeof ocrInstance> | null = null

async function getOcr(onProgress?: (p: number, m?: string) => void): Promise<NonNullable<typeof ocrInstance>> {
  if (ocrInstance) return ocrInstance
  if (initPromise) return (await initPromise)!
  initPromise = (async () => {
    onProgress?.(0.1, 'OCRエンジンを準備中…（初回のみ・モデルを取得します）')
    // CDN から実行時ロード（バンドルしない）。Vite に解析させないため @vite-ignore。
    const mod: any = await import(/* @vite-ignore */ OCR_BROWSER_CDN)
    const Ocr = mod.default ?? mod.Ocr ?? mod
    const instance = await Ocr.create({
      models: PADDLE_MODELS,
      onnxOptions: {
        executionProviders: [{ name: 'webgpu' }, { name: 'wasm' }],
      },
    })
    ocrInstance = instance
    return instance
  })()
  return (await initPromise)!
}

function boxToBBox(box?: number[][]): OcrLine['bbox'] {
  if (!box || box.length === 0) return undefined
  const xs = box.map((p) => p[0])
  const ys = box.map((p) => p[1])
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) }
}

export const paddleProvider: OcrProvider = {
  id: 'paddle',
  label: 'PaddleOCR（高精度・推奨）',
  tier: 'primary',

  async isAvailable() {
    // WebAssembly があれば動作可（WebGPU は無くても wasm で動く）
    return typeof WebAssembly === 'object'
  },

  async recognize(image: HTMLCanvasElement | Blob, opts: OcrRecognizeOptions = {}): Promise<OcrResult> {
    const ocr = await getOcr(opts.onProgress)
    const canvas =
      image instanceof HTMLCanvasElement
        ? image
        : await (async () => {
            const bmp = await createImageBitmap(image)
            const c = document.createElement('canvas')
            c.width = bmp.width
            c.height = bmp.height
            c.getContext('2d')!.drawImage(bmp, 0, 0)
            bmp.close()
            return c
          })()

    const url = await canvasToUrl(canvas)
    try {
      opts.onProgress?.(0.5, '文字を読み取っています…')
      const glines = (await ocr.detect(url)) as GLine[]
      const lines: OcrLine[] = glines
        .filter((g) => g.text)
        .map((g) => ({ text: g.text, bbox: boxToBBox(g.box), confidence: g.mean }))
      const conf =
        lines.length > 0 ? lines.reduce((a, l) => a + (l.confidence ?? 0), 0) / lines.length : 0
      return {
        providerId: this.id,
        lines,
        text: lines.map((l) => l.text).join('\n'),
        confidence: conf,
      }
    } finally {
      URL.revokeObjectURL(url)
    }
  },
}
