// Tesseract.js プロバイダ（fallback / baseline）。
// 端末内・無料・軽量だが、雑な写真や日本語票には弱い。本命は PaddleOCR。
import Tesseract from 'tesseract.js'
import type { OcrLine, OcrProvider, OcrRecognizeOptions, OcrResult } from './types'
import { canvasToUrl } from './preprocess'

const WORKER_PATH = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js'
const CORE_PATH = 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5'
const LANG_PATH = 'https://tessdata.projectnaptha.com/4.0.0'

let worker: Tesseract.Worker | null = null
let ready: Promise<Tesseract.Worker> | null = null

async function getWorker(onProgress?: (p: number, m?: string) => void): Promise<Tesseract.Worker> {
  if (worker) return worker
  if (ready) return ready
  ready = (async () => {
    try {
      const w = await Tesseract.createWorker(['jpn', 'eng'], 1, {
        workerPath: WORKER_PATH,
        corePath: CORE_PATH,
        langPath: LANG_PATH,
        logger: (m: { status: string; progress: number }) => {
          if (!onProgress) return
          if (m.status?.includes('traineddata')) onProgress(0.1 + m.progress * 0.15, '言語データを読み込み中…（初回のみ）')
        },
      })
      worker = w
      return w
    } catch (e) {
      worker = null
      ready = null
      throw e
    }
  })()
  return ready
}

export const tesseractProvider: OcrProvider = {
  id: 'tesseract',
  label: 'Tesseract（軽量・予備）',
  tier: 'fallback',

  async isAvailable() {
    return true
  },

  async recognize(image: HTMLCanvasElement | Blob, opts: OcrRecognizeOptions = {}): Promise<OcrResult> {
    const w = await getWorker(opts.onProgress)
    const input = image instanceof HTMLCanvasElement ? await canvasToUrl(image) : image
    try {
      const { data } = await w.recognize(input)
      const lines: OcrLine[] = (data.lines ?? []).map((l) => ({
        text: l.text,
        bbox: l.bbox,
        confidence: (l.confidence ?? 0) / 100,
      }))
      return {
        providerId: this.id,
        lines: lines.length ? lines : (data.text ?? '').split('\n').map((t) => ({ text: t })),
        text: data.text ?? '',
        confidence: (data.confidence ?? 0) / 100,
      }
    } finally {
      if (typeof input === 'string') URL.revokeObjectURL(input)
    }
  },

  async terminate() {
    if (worker) {
      await worker.terminate()
      worker = null
      ready = null
    }
  },
}
