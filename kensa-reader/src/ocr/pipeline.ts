// OCRパイプライン: 前処理 → 向き自動判定 → プロバイダ認識 → 列認識の表再構成。
// プロバイダ非依存。Paddle/Tesseract どちらでも同じ流れで「行(rows)」を得る。
import { scoreText } from '../parse/extract'
import { toCanvas } from './preprocess'
import { reconstructRows } from './rows'
import type { OcrProvider } from './types'

export interface OcrPipelineResult {
  providerId: string
  rows: string[]
  text: string
  confidence: number
  angle: number
}

const ORIENT_EDGE = 1500
const FINAL_EDGE = 2200
const GOOD_ENOUGH = 8

export async function runOcr(
  image: Blob,
  provider: OcrProvider,
  opts: { onProgress?: (p: number, message?: string) => void } = {},
): Promise<OcrPipelineResult> {
  const { onProgress } = opts
  onProgress?.(0.05, '画像を準備しています…')

  // 向き自動判定（小さめ画像で 0/90/270/180 を試し、項目が最も読めた向きを採用）
  const angles = [0, 90, 270, 180]
  let best = { angle: 0, score: -1 }
  for (let i = 0; i < angles.length; i++) {
    const a = angles[i]
    onProgress?.(0.1 + i * 0.05, '写真の向きを調べています…')
    const canvas = await toCanvas(image, { targetLongEdge: ORIENT_EDGE, rotate: a })
    const res = await provider.recognize(canvas, { onProgress })
    const rows = reconstructRows(res.lines)
    const score = scoreText(rows)
    if (score > best.score) best = { angle: a, score }
    if (score >= GOOD_ENOUGH) break
  }

  // 採用した向きで高解像度の本番OCR
  onProgress?.(0.6, '文字を読み取っています…')
  const finalCanvas = await toCanvas(image, { targetLongEdge: FINAL_EDGE, rotate: best.angle })
  const res = await provider.recognize(finalCanvas, { onProgress })
  const rows = reconstructRows(res.lines)
  onProgress?.(0.95, '内容を整理しています…')

  return {
    providerId: res.providerId,
    rows,
    text: rows.join('\n') || res.text,
    confidence: res.confidence,
    angle: best.angle,
  }
}
