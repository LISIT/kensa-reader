// 外部AI（ChatGPT/Claude/Gemini）へ渡す導線。API連携はしない。
// ネイティブ(Capacitor)では native share で画像＋質問文を一度に渡す（WebViewのフリーズを回避）。
// Web(プロトタイプ)では navigator.share / クリップボードで代替する。
import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import { Filesystem, Directory } from '@capacitor/filesystem'

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform()
}

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

export type ShareResult = 'shared' | 'cancelled' | 'unsupported' | 'failed'

/** 画像を端末の共有シートで送る（画像のみ＝より多くのAIアプリが候補に出る。
 *  質問文は別途クリップボードにコピーしておき、送り先で貼り付けてもらう）。 */
export async function shareImage(image: Blob): Promise<ShareResult> {
  try {
    const file = new File([image], 'kensa.jpg', { type: image.type || 'image/jpeg' })
    const data: ShareData = { files: [file] }
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
    if (nav.canShare && nav.canShare({ files: [file] })) {
      await navigator.share(data)
      return 'shared'
    }
    return 'unsupported'
  } catch (e) {
    // ユーザーがキャンセルした場合は AbortError
    if ((e as Error)?.name === 'AbortError') return 'cancelled'
    return 'failed'
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onloadend = () => resolve(String(r.result).split(',')[1] || '')
    r.onerror = () => reject(new Error('read failed'))
    r.readAsDataURL(blob)
  })
}

/** ネイティブ共有: 画像をキャッシュに書き、画像＋質問文を一度に共有する */
export async function shareNative(blob: Blob, text: string): Promise<ShareResult> {
  try {
    const data = await blobToBase64(blob)
    const fileName = `kensa-${Date.now()}.jpg`
    const written = await Filesystem.writeFile({ path: fileName, data, directory: Directory.Cache })
    await Share.share({ text, files: [written.uri] })
    return 'shared'
  } catch (e) {
    const msg = String((e as Error)?.message ?? e).toLowerCase()
    if (msg.includes('cancel')) return 'cancelled'
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
