// エンジン（解析バックエンド）の共通契約
import type { Sex } from '../knowledge/bloodTests'

export type Flag = 'low' | 'normal' | 'high' | 'unknown'

export interface LabValue {
  /** OCR上の生の名称 */
  rawName: string
  /** ナレッジ照合できた場合のID */
  itemId?: string
  /** 表示名（照合できれば日本語、できなければ生名称） */
  displayName: string
  category?: string
  value: number | null
  unit?: string
  /** 検査用紙に印字されていた基準値（読み取れた場合） */
  printedRange?: { low?: number; high?: number; text?: string }
  /** 実際に判定に採用した基準値（印字 > ナレッジ の優先順位） */
  usedRange?: { low?: number; high?: number; source: 'printed' | 'knowledge' }
  flag: Flag
  about?: string
  /** 高い/低いの一般的な意味 */
  flagMeaning?: string
  /** 0..1。OCR・照合の確からしさの目安 */
  confidence: number
}

export interface AnalysisResult {
  engineId: string
  engineLabel: string
  sex: Sex
  values: LabValue[]
  /** やさしい全体サマリ */
  summary: string
  /** 注意書き・読み取れなかった旨など */
  warnings: string[]
  /** OCRの生テキスト（デバッグ/確認用） */
  rawText?: string
}

export interface AnalyzeOptions {
  sex: Sex
  /** 進捗(0..1)とメッセージ */
  onProgress?: (p: number, message?: string) => void
}

export interface Engine {
  id: string
  label: string
  /** APIキーやローカルサーバ等、追加設定が要るか */
  requiresSetup: boolean
  /** いま利用可能か（キー設定済み・サーバ応答あり 等） */
  isAvailable(): Promise<boolean>
  analyzeBloodTest(image: Blob, opts: AnalyzeOptions): Promise<AnalysisResult>
}
