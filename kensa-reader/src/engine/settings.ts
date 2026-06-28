// 設定の保存（localStorage）。APIキーは端末内にのみ保存し、外部に送りません。
import type { Sex } from '../knowledge/bloodTests'
import type { OcrProviderId } from '../ocr'

export type EngineId = 'local' | 'claude' | 'ollama'

export interface Settings {
  engineId: EngineId
  /** OCRエンジン。本命=paddle、予備=tesseract。 */
  ocrProviderId: OcrProviderId
  sex: Sex
  fontScale: number // 1.0 = 標準, 1.25, 1.5
  claude: { apiKey: string; model: string }
  ollama: { url: string; model: string }
  disclaimerAccepted: boolean
}

const KEY = 'kensa-reader/settings/v2'

export const DEFAULT_SETTINGS: Settings = {
  engineId: 'local',
  // 既定は安定動作する tesseract。PaddleOCRはiOS Safariでメモリ不足によりタブが
  // 落ちることがあるため、実験的オプション扱い（設定で選択可）。
  ocrProviderId: 'tesseract',
  sex: 'unknown',
  fontScale: 1.0,
  claude: { apiKey: '', model: 'claude-sonnet-4-6' },
  ollama: { url: 'http://127.0.0.1:11434', model: 'hf.co/unsloth/medgemma-1.5-4b-it-GGUF:Q4_K_M' },
  disclaimerAccepted: false,
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      claude: { ...DEFAULT_SETTINGS.claude, ...(parsed.claude ?? {}) },
      ollama: { ...DEFAULT_SETTINGS.ollama, ...(parsed.ollama ?? {}) },
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* 保存できなくても致命的ではない */
  }
}
