// Tesseract.js による端末内 OCR。
// ★プライバシー: 認識処理はブラウザ内（端末上）で実行されます。
//   CDN から取得するのは「文字認識モデル」だけで、ユーザーの写真は送信しません。

import Tesseract from 'tesseract.js'

let worker: Tesseract.Worker | null = null
let workerReady: Promise<Tesseract.Worker> | null = null

// tesseract.js v5 用の既知の動作する CDN パス。
const WORKER_PATH = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js'
const CORE_PATH = 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5'
// 言語データ(.traineddata.gz)の配布元。projectnaptha が tesseract.js の既定配布元。
const LANG_PATH = 'https://tessdata.projectnaptha.com/4.0.0'

const OCR_TIMEOUT_MS = 120_000

function withTimeout<T>(p: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(message)), ms)
    p.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      },
    )
  })
}

async function getWorker(
  onProgress?: (p: number, message?: string) => void,
): Promise<Tesseract.Worker> {
  if (worker) return worker
  if (workerReady) return workerReady

  workerReady = (async () => {
    try {
      // 日本語＋英語。血液検査表は英語略語と日本語が混在するため両方。
      const w = await Tesseract.createWorker(['jpn', 'eng'], 1, {
        workerPath: WORKER_PATH,
        corePath: CORE_PATH,
        langPath: LANG_PATH,
        logger: (m: { status: string; progress: number }) => {
          if (!onProgress) return
          const s = m.status || ''
          if (s.includes('recognizing text')) {
            onProgress(0.45 + m.progress * 0.5, '文字を読み取っています…')
          } else if (s.includes('traineddata')) {
            onProgress(0.15 + m.progress * 0.25, '言語データを読み込んでいます…（初回のみ）')
          } else if (s.includes('core')) {
            onProgress(0.1 + m.progress * 0.05, 'OCRエンジンを読み込んでいます…')
          } else {
            onProgress(0.15, '準備しています…')
          }
        },
      })
      worker = w
      return w
    } catch (e) {
      // 失敗時はキャッシュを破棄して、次回リトライできるようにする
      worker = null
      workerReady = null
      throw e
    }
  })()

  return workerReady
}

/** iPhone等の高解像度写真を縮小してOCRを高速化・省メモリ化する */
async function preprocess(image: Blob, maxDim = 2200): Promise<HTMLCanvasElement | Blob> {
  try {
    const bitmap = await createImageBitmap(image)
    const { width, height } = bitmap
    const scale = Math.min(1, maxDim / Math.max(width, height))
    const w = Math.max(1, Math.round(width * scale))
    const h = Math.max(1, Math.round(height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return image
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close()
    return canvas
  } catch {
    // createImageBitmap 非対応など → 元画像をそのまま渡す
    return image
  }
}

export interface OcrResult {
  text: string
  lines: { text: string; bbox?: { x0: number; y0: number; x1: number; y1: number } }[]
  confidence: number
}

export async function runOcr(
  image: Blob,
  onProgress?: (p: number, message?: string) => void,
): Promise<OcrResult> {
  onProgress?.(0.08, '画像を準備しています…')
  const input = await preprocess(image)

  const w = await withTimeout(
    getWorker(onProgress),
    OCR_TIMEOUT_MS,
    'OCRモデルの読み込みに時間がかかっています。電波の良い場所で、ページを再読み込みしてからもう一度お試しください。',
  )

  const { data } = await withTimeout(
    w.recognize(input),
    OCR_TIMEOUT_MS,
    '文字の読み取りに時間がかかりすぎました。写真を小さめに、表だけが写るように撮り直すと読みやすくなります。',
  )

  const lines = (data.lines ?? []).map((l) => ({ text: l.text, bbox: l.bbox }))

  return {
    text: data.text ?? '',
    lines: lines.length > 0 ? lines : (data.text ?? '').split('\n').map((t) => ({ text: t })),
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
