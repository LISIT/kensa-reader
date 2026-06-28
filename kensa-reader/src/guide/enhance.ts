// AIに渡す画像を見やすく補正する（カラー維持・コントラスト強調・リサイズ・回転）。
// 台形/傾き補正・余白除去は今後 OpenCV.js で追加予定（TODO）。

export interface EnhancedImage {
  blob: Blob
  url: string
  width: number
  height: number
}

async function loadBitmap(image: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(image, { imageOrientation: 'from-image' })
  } catch {
    return await createImageBitmap(image)
  }
}

export async function enhanceImage(
  image: Blob,
  opts: { rotate?: number; maxEdge?: number } = {},
): Promise<EnhancedImage> {
  const bmp = await loadBitmap(image)
  const maxEdge = opts.maxEdge ?? 2000
  const long = Math.max(bmp.width, bmp.height)
  const scale = Math.min(1, maxEdge / long)
  const baseW = Math.max(1, Math.round(bmp.width * scale))
  const baseH = Math.max(1, Math.round(bmp.height * scale))

  const rot = ((opts.rotate ?? 0) % 360 + 360) % 360
  const swap = rot === 90 || rot === 270
  const canvas = document.createElement('canvas')
  canvas.width = swap ? baseH : baseW
  canvas.height = swap ? baseW : baseH
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  // コントラスト・明るさ・彩度を少し上げて読みやすく（文字が締まる）
  ctx.filter = 'contrast(1.12) brightness(1.04) saturate(1.05)'
  ctx.translate(canvas.width / 2, canvas.height / 2)
  if (rot) ctx.rotate((rot * Math.PI) / 180)
  ctx.drawImage(bmp, -baseW / 2, -baseH / 2, baseW, baseH)
  bmp.close()

  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.92),
  )
  return { blob, url: URL.createObjectURL(blob), width: canvas.width, height: canvas.height }
}
