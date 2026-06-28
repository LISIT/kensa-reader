// 外部AI（ChatGPT/Claude/Gemini）へ渡す導線。API連携はしない。
// ユーザーが自分のアプリ/ブラウザで、画像を添付し、質問文を貼り付ける流れを最短にする。

export interface AiTarget {
  id: string
  label: string
  emoji: string
  url: string
}

// 「○○で説明してもらう」ボタン用。AI名はそのまま見せてよい（安心感のため）。
export const AI_TARGETS: AiTarget[] = [
  { id: 'chatgpt', label: 'ChatGPT', emoji: '🟢', url: 'https://chatgpt.com/' },
  { id: 'claude', label: 'Claude', emoji: '🟠', url: 'https://claude.ai/new' },
  { id: 'gemini', label: 'Gemini', emoji: '🔷', url: 'https://gemini.google.com/app' },
]

/** 質問文をクリップボードへコピー（失敗時 false） */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fallthrough */
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

export type ShareResult = 'shared' | 'unsupported' | 'failed'

/** 画像＋質問文を端末の共有シートで送る（iOS等で対応AIアプリに直接渡せる） */
export async function shareImageAndText(image: Blob, text: string): Promise<ShareResult> {
  try {
    const file = new File([image], 'kensa.jpg', { type: image.type || 'image/jpeg' })
    const data: ShareData = { files: [file], text }
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
    if (nav.canShare && nav.canShare({ files: [file] })) {
      await navigator.share(data)
      return 'shared'
    }
    return 'unsupported'
  } catch (e) {
    // ユーザーがキャンセルした場合も例外になる
    if ((e as Error)?.name === 'AbortError') return 'shared'
    return 'failed'
  }
}

/** 画像を保存（ダウンロード）。iOSでは「写真に保存」導線になる */
export function downloadImage(image: Blob, filename = 'kensa.jpg'): void {
  const url = URL.createObjectURL(image)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
