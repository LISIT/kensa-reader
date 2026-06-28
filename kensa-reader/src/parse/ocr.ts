// Tesseract.js による端末内 OCR。
// ★プライバシー: 認識処理はブラウザ内（端末上）で実行されます。
//   CDN(jsdelivr) から取得するのは「文字認識モデル」だけで、ユーザーの写真は送信しません。

import Tesseract from 'tesseract.js'

let worker: Tesseract.Worker | null = null
let workerReady: Promise<Tesseract.Worker> | null = null

const CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@5'
const LANG_PATH = 'https://cdn.jsdelivr.net/npm/@tesseract.js-data'

async function getWorker(
  onProgress?: (p: number, message?: string) => void,
): Promise<Tesseract.Worker> {
  if (worker) return worker
  if (workerReady) return workerReady

  workerReady = (async () => {
    // 日本語＋英語。血液検査表は英語略語と日本語が混在するため両方。
    const w = await Tesseract.createWorker(['jpn', 'eng'], 1, {
      workerPath: `${CDN}/dist/worker.min.js`,
      corePath: `https://cdn.jsdelivr.net/npm/tesseract.js-core@5`,
      langPath: LANG_PATH,
      logger: (m: { status: string; progress: number }) => {
        if (m.status === 'recognizing text') {
          onProgress?.(0.3 + m.progress * 0.6, '文字を読み取っています…')
        } else if (onProgress) {
          onProgress(0.15, 'モデルを準備しています…')
        }
      },
    })
    worker = w
    return w
  })()

  return workerReady
}

export interface OcrResult {
  text: string
  /** 行ごと（座標つき）。表のレイアウト復元に使う。 */
  lines: { text: string; bbox?: { x0: number; y0: number; x1: number; y1: number } }[]
  confidence: number
}

export async function runOcr(
  image: Blob,
  onProgress?: (p: number, message?: string) => void,
): Promise<OcrResult> {
  const w = await getWorker(onProgress)
  onProgress?.(0.3, '文字を読み取っています…')
  const { data } = await w.recognize(image)

  const lines = (data.lines ?? []).map((l) => ({
    text: l.text,
    bbox: l.bbox,
  }))

  return {
    text: data.text ?? '',
    lines: lines.length > 0 ? lines : data.text.split('\n').map((t) => ({ text: t })),
    confidence: (data.confidence ?? 0) / 100,
  }
}

export async function terminateOcr(): Promise<void> {
  if (worker) {
    await worker.terminate()
    worker = null
    workerReady = null
  }
}
