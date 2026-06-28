// OCRエンジンの差し替え可能な抽象化レイヤー。
// Tesseract / PaddleOCR / RapidOCR / (将来) VisionLLM を同じ契約で扱う。

export interface OcrLine {
  text: string
  /** 元画像（前処理後）座標系での外接矩形 */
  bbox?: { x0: number; y0: number; x1: number; y1: number }
  /** 0..1 */
  confidence?: number
}

export interface OcrResult {
  providerId: string
  lines: OcrLine[]
  text: string
  /** 0..1 全体の確からしさ */
  confidence: number
  /** 採用した回転角（向き自動判定の結果） */
  angle?: number
}

export interface OcrRecognizeOptions {
  onProgress?: (p: number, message?: string) => void
  /** ページセグメンテーション等、プロバイダ固有の細かな指定（任意） */
  hints?: Record<string, string>
}

export interface OcrProvider {
  id: string
  label: string
  /** 本命(primary)か fallback/baseline か。UIや既定選択に使う。 */
  tier: 'primary' | 'fallback'
  /** モデル取得や実行環境(WebGPU等)が利用可能か */
  isAvailable(): Promise<boolean>
  /** 画像(前処理済み canvas 推奨)を認識して行を返す */
  recognize(image: HTMLCanvasElement | Blob, opts?: OcrRecognizeOptions): Promise<OcrResult>
  /** 解放（任意） */
  terminate?(): Promise<void>
}
