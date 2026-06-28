// 既定エンジン: 端末内 OCR + 内蔵ナレッジ。
// APIキー不要・送信なし・運用費ゼロ。血液検査の数値判定はここが最も確実。
import { runOcr } from '../parse/ocr'
import { extractLabValues } from '../parse/extract'
import { buildSummary } from './summary'
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
    onProgress?.(0.05, '準備しています…')

    const ocr = await runOcr(image, onProgress)
    onProgress?.(0.9, '内容を整理しています…')

    const lineTexts = ocr.lines.map((l) => l.text)
    const { values, unmatchedLines } = extractLabValues(lineTexts, sex)

    const warnings: string[] = []
    if (ocr.confidence < 0.5) {
      warnings.push('写真の文字認識の確からしさが低めです。明るい場所で、表が大きく・まっすぐ写るように撮り直すと精度が上がります。')
    }
    if (values.length === 0) {
      warnings.push('検査項目を読み取れませんでした。血液検査の「数値の表」が写っているか確認してください。')
    }
    if (values.some((v) => v.usedRange?.source === 'knowledge')) {
      warnings.push('一部の基準値は、用紙からは読み取れなかったため一般的な目安を使っています。実際の判定は用紙に印字された基準値・主治医の説明を優先してください。')
    }
    if (unmatchedLines.length > 0) {
      warnings.push(`読み取れなかった行が${unmatchedLines.length}行あります（このアプリがまだ知らない項目かもしれません）。`)
    }

    onProgress?.(1, '完了')

    return {
      engineId: this.id,
      engineLabel: this.label,
      sex,
      values,
      summary: buildSummary(values),
      warnings,
      rawText: ocr.text,
    }
  },
}
