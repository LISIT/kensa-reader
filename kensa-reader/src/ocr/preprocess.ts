// 共通画像前処理（ブラウザ canvas ベース・sharp非依存）。
// 役割: EXIF向き尊重・リサイズ/アップスケール・回転・(任意)グレースケール/コントラスト。
// 台形補正・余白除去・複数票分割は今後 OpenCV.js 等で追加予定（TODO）。

export interface CanvasPrepOptions {
  /** 最大辺の目標px。元が小さければアップスケール、大きければ縮小。 */
  targetLongEdge?: number
  /** 回転角（時計回り, deg）。0/90/180/270 を想定。 */
  rotate?: number
  /** グレースケール化 */
  grayscale?: boolean
  /** コントラスト正規化（簡易ヒストグラムストレッチ） */
  contrast?: boolean
}

/** Blob → (EXIF尊重) ImageBitmap */
async function loadBitmap(image: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(image, { imageOrientation: 'from-image' })
  } catch {
    return await createImageBitmap(image)
  }
}

/** Blob/ImageBitmap を前処理して canvas を返す */
export async function toCanvas(
  image: Blob | ImageBitmap,
  opts: CanvasPrepOptions = {},
): Promise<HTMLCanvasElement> {
  const bitmap = image instanceof Blob ? await loadBitmap(image) : image
  const target = opts.targetLongEdge ?? 2200
  const long = Math.max(bitmap.width, bitmap.height)
  const scale = long < target ? Math.min(2.5, target / long) : Math.min(1, target / long)
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))

  let canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, w, h)
  if (image instanceof Blob) bitmap.close()

  if (opts.rotate) canvas = rotateCanvas(canvas, opts.rotate)
  if (opts.grayscale || opts.contrast) applyFilters(canvas, opts)
  return canvas
}

/** canvas を時計回りに deg 度回転した新しい canvas を返す */
export function rotateCanvas(src: HTMLCanvasElement, deg: number): HTMLCanvasElement {
  const d = ((deg % 360) + 360) % 360
  if (d === 0) return src
  const rad = (d * Math.PI) / 180
  const swap = d === 90 || d === 270
  const canvas = document.createElement('canvas')
  canvas.width = swap ? src.height : src.width
  canvas.height = swap ? src.width : src.height
  const ctx = canvas.getContext('2d')!
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate(rad)
  ctx.drawImage(src, -src.width / 2, -src.height / 2)
  return canvas
}

function applyFilters(canvas: HTMLCanvasElement, opts: CanvasPrepOptions): void {
  const ctx = canvas.getContext('2d')!
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const d = img.data

  if (opts.grayscale || opts.contrast) {
    // グレースケール値を計算
    for (let i = 0; i < d.length; i += 4) {
      const g = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) | 0
      d[i] = d[i + 1] = d[i + 2] = g
    }
  }
  if (opts.contrast) {
    // 2〜98パーセンタイルでヒストグラムストレッチ
    const hist = new Array(256).fill(0)
    for (let i = 0; i < d.length; i += 4) hist[d[i]]++
    const total = canvas.width * canvas.height
    let lo = 0
    let hi = 255
    let acc = 0
    for (let v = 0; v < 256; v++) {
      acc += hist[v]
      if (acc > total * 0.02) {
        lo = v
        break
      }
    }
    acc = 0
    for (let v = 255; v >= 0; v--) {
      acc += hist[v]
      if (acc > total * 0.02) {
        hi = v
        break
      }
    }
    const range = Math.max(1, hi - lo)
    for (let i = 0; i < d.length; i += 4) {
      const v = Math.max(0, Math.min(255, ((d[i] - lo) * 255) / range))
      d[i] = d[i + 1] = d[i + 2] = v
    }
  }
  ctx.putImageData(img, 0, 0)
}

/** canvas → blob URL（@gutenye/ocr-browser など URL入力のOCRに渡す用） */
export async function canvasToUrl(canvas: HTMLCanvasElement): Promise<string> {
  return await new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(URL.createObjectURL(blob!)), 'image/png')
  })
}
