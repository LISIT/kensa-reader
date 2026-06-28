// 既定エンジン: 端末内OCR(プロバイダ差し替え可) + 内蔵ナレッジ。
// APIキー不要・送信なし・運用費ゼロ。OCR本命=PaddleOCR、予備=Tesseract。
import { extractLabValues } from '../parse/extract'
import { runOcr, resolveOcrProvider, getOcrProvider } from '../ocr'
import { buildSummary } from './summary'
import { loadSettings } from './settings'
import type { OcrPipelineResult } from '../ocr/pipeline'
import type { AnalysisResult, AnalyzeOptions, Engine } from './types'

export const localEngine: Engine = {
  id: 'local',
  label: '端末内（キー不要・送信なし）',
  requiresSetup: false,

  async isAvailable() {
    return true
  },

  async analyzeBloodTest(image: Blob, opts: AnalyzeOptions): Promise<AnalysisResult> {
    const { sex, onProgress } = opts
    onProgress?.(0.03, '準備しています…')

    const wantedId = loadSettings().ocrProviderId
    let provider = await resolveOcrProvider(wantedId)
    let usedProviderId = provider.id
    let fellBack = provider.id !== wantedId

    let ocr: OcrPipelineResult
    let primaryError = ''
    try {
      ocr = await runOcr(image, provider, { onProgress })
    } catch (e) {
      // 本命OCR(主にPaddle: CDN/WebGPU/wasm依存)が失敗したら予備のTesseractで再試行
      primaryError = String((e as Error)?.message ?? e).slice(0, 300)
      const fallback = getOcrProvider('tesseract')
      if (provider.id !== fallback.id) {
        provider = fallback
        usedProviderId = fallback.id
        fellBack = true
        onProgress?.(0.1, '予備エンジンで読み取り直しています…')
        ocr = await runOcr(image, fallback, { onProgress })
      } else {
        throw e
      }
    }

    const { values, unmatchedLines } = extractLabValues(ocr.rows, sex)

    const warnings: string[] = []
    if (fellBack && usedProviderId === 'tesseract' && wantedId !== 'tesseract') {
      warnings.push('高精度OCR(PaddleOCR)が使えなかったため、予備エンジンで読み取りました。')
      if (primaryError) warnings.push(`【診断情報】PaddleOCR失敗理由: ${primaryError}`)
    }
    if (values.length === 0) {
      warnings.push('検査項目を読み取れませんでした。血液検査の「数値の表」が大きく・まっすぐ写るように撮り直してください。')
    }
    if (values.some((v) => v.usedRange?.source === 'knowledge')) {
      warnings.push('一部の基準値は、用紙からは読み取れなかったため一般的な目安を使っています。実際の判定は用紙の基準値・主治医の説明を優先してください。')
    }
    if (unmatchedLines.length > 0) {
      warnings.push(`読み取れなかった行が${unmatchedLines.length}行あります（このアプリがまだ知らない項目や、読み取りにくかった箇所かもしれません）。`)
    }

    onProgress?.(1, '完了')

    return {
      engineId: this.id,
      engineLabel: `${this.label} / OCR: ${provider.label}`,
      sex,
      values,
      summary: buildSummary(values),
      warnings,
      rawText: ocr.text,
    }
  },
}
