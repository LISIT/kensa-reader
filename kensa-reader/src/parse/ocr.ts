// Tesseract.js による端末内 OCR。
// ★プライバシー: 認識処理はブラウザ内（端末上）で実行されます。
//   CDN から取得するのは「文字認識モデル」だけで、ユーザーの写真は送信しません。

import Tesseract from 'tesseract.js'
import { scoreText } from './extract'

let worker: Tesseract.Worker | null = null
let workerReady: Promise<Tesseract.Worker> | null = null

// tesseract.js v5 用の既知の動作する CDN パス。
const WORKER_PATH = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js'
const CORE_PATH = 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5'
const LANG_PATH = 'https://tessdata.projectnaptha.com/4.0.0'

const OCR_TIMEOUT_MS = 120_000
// 向き自動判定: この数だけ項目が読めたら「正しい向き」と判断して打ち切る
const GOOD_ENOUGH = 8

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
      const w = await Tesseract.createWorker(['jpn', 'eng'], 1, {
        workerPath: WORKER_PATH,
        corePath: CORE_PATH,
        langPath: LANG_PATH,
        logger: (m: { status: string; progress: number }) => {
          if (!onProgress) return
          const s = m.status || ''
          if (s.includes('traineddata')) {
            onProgress(0.12 + m.progress * 0.18, '言語データを読み込んでいます…（初回のみ）')
          } else if (s.includes('core')) {
            onProgress(0.08 + m.progress * 0.04, 'OCRエンジンを読み込んでいます…')
          }
        },
      })
      worker = w
      return w
    } catch (e) {
      worker = null
      workerReady = null
      throw e
    }
  })()

  return workerReady
}

/** Blob を（EXIF向きを尊重して）指定最大辺の canvas に描画 */
async function toCanvas(image: Blob, maxDim: number): Promise<HTMLCanvasElement | null> {
  try {
    let bitmap: ImageBitmap
    try {
      bitmap = await createImageBitmap(image, { imageOrientation: 'from-image' })
    } catch {
      bitmap = await createImageBitmap(image)
    }
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close()
    return canvas
  } catch {
    return null
  }
}

/** canvas を時計回りに deg 度回転した新しい canvas を返す */
function rotateCanvas(src: HTMLCanvasElement, deg: number): HTMLCanvasElement {
  if (deg === 0) return src
  const rad = (deg * Math.PI) / 180
  const swap = deg === 90 || deg === 270
  const canvas = document.createElement('canvas')
  canvas.width = swap ? src.height : src.width
  canvas.height = swap ? src.width : src.height
  const ctx = canvas.getContext('2d')!
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate(rad)
  ctx.drawImage(src, -src.width / 2, -src.height / 2)
  return canvas
}

export interface OcrResult {
  text: string
  lines: { text: string; bbox?: { x0: number; y0: number; x1: number; y1: number } }[]
  confidence: number
  /** 採用した回転角（デバッグ用） */
  angle: number
}

function toLines(data: Tesseract.Page): OcrResult['lines'] {
  const lines = (data.lines ?? []).map((l) => ({ text: l.text, bbox: l.bbox }))
  return lines.length > 0 ? lines : (data.text ?? '').split('\n').map((t) => ({ text: t }))
}

export async function runOcr(
  image: Blob,
  onProgress?: (p: number, message?: string) => void,
): Promise<OcrResult> {
  onProgress?.(0.06, '画像を準備しています…')
  const small = await toCanvas(image, 1500) // 向き判定用（細長い帯でも文字が潰れない程度）

  const w = await withTimeout(
    getWorker(onProgress),
    OCR_TIMEOUT_MS,
    'OCRモデルの読み込みに時間がかかっています。電波の良い場所で、ページを再読み込みしてからお試しください。',
  )

  if (!small) {
    // canvas 不可環境 → 元画像でそのまま1回
    const { data } = await withTimeout(w.recognize(image), OCR_TIMEOUT_MS, '読み取りに時間がかかりすぎました。')
    return { text: data.text ?? '', lines: toLines(data), confidence: (data.confidence ?? 0) / 100, angle: 0 }
  }

  // --- 向きの自動判定: 0/90/270/180 を試し、項目が一番読めた向きを採用 ---
  const angles = [0, 90, 270, 180]
  let bestAngle = 0
  let bestScore = -1
  let bestData: Tesseract.Page | null = null

  for (let i = 0; i < angles.length; i++) {
    const a = angles[i]
    onProgress?.(0.32 + i * 0.04, '写真の向きを調べています…')
    const canvas = rotateCanvas(small, a)
    const { data } = await withTimeout(
      w.recognize(canvas),
      OCR_TIMEOUT_MS,
      '読み取りに時間がかかりすぎました。明るい場所で撮り直してみてください。',
    )
    const score = scoreText(toLines(data).map((l) => l.text))
    if (score > bestScore) {
      bestScore = score
      bestAngle = a
      bestData = data
    }
    if (score >= GOOD_ENOUGH) break
  }

  // --- 採用した向きで高解像度で本番OCR（精度重視） ---
  const big = await toCanvas(image, 2400)
  if (big) {
    onProgress?.(0.55, '文字を読み取っています…')
    const canvas = rotateCanvas(big, bestAngle)
    const { data } = await withTimeout(
      w.recognize(canvas),
      OCR_TIMEOUT_MS,
      '文字の読み取りに時間がかかりすぎました。表だけが大きく写るように撮り直すと読みやすくなります。',
    )
    onProgress?.(0.95, '内容を整理しています…')
    return { text: data.text ?? '', lines: toLines(data), confidence: (data.confidence ?? 0) / 100, angle: bestAngle }
  }

  // 高解像度が作れなければ、向き判定の結果をそのまま使う
  const data = bestData!
  return { text: data.text ?? '', lines: toLines(data), confidence: (data.confidence ?? 0) / 100, angle: bestAngle }
}

export async function terminateOcr(): Promise<void> {
  if (worker) {
    await worker.terminate()
    worker = null
    workerReady = null
  }
}
