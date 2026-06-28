// OCRプロバイダのレジストリ。本命=Paddle、予備=Tesseract。
import { paddleProvider } from './paddleProvider'
import { tesseractProvider } from './tesseractProvider'
import type { OcrProvider } from './types'

export type OcrProviderId = 'paddle' | 'tesseract'

export const OCR_PROVIDERS: Record<OcrProviderId, OcrProvider> = {
  paddle: paddleProvider,
  tesseract: tesseractProvider,
}

export function getOcrProvider(id: OcrProviderId): OcrProvider {
  return OCR_PROVIDERS[id] ?? paddleProvider
}

/** 選択プロバイダが使えなければ自動でフォールバック先を返す */
export async function resolveOcrProvider(id: OcrProviderId): Promise<OcrProvider> {
  const primary = getOcrProvider(id)
  if (await primary.isAvailable()) return primary
  if (await tesseractProvider.isAvailable()) return tesseractProvider
  return primary
}

export * from './types'
export { runOcr } from './pipeline'
