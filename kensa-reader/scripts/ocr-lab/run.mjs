// ローカルOCR検証ハーネス（実画像で前処理×OCR設定を総当たりし、抽出項目数で採点）。
// 使い方:
//   1) samples/private/ に実画像(jpg/png)を置く（.gitignoreで除外済み・非公開）
//   2) npx esbuild src/parse/extract.ts --bundle --platform=node --format=esm --outfile=scripts/ocr-lab/extract.bundle.mjs
//   3) node scripts/ocr-lab/run.mjs
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import sharp from 'sharp'
import { createWorker } from 'tesseract.js'
import { extractLabValues } from './extract.bundle.mjs'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..')
const SAMPLES = path.join(ROOT, 'samples', 'private')

function listImages() {
  if (!fs.existsSync(SAMPLES)) return []
  return fs.readdirSync(SAMPLES).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).map((f) => path.join(SAMPLES, f))
}

// 前処理（sharp）。EXIF補正→手動回転→リサイズ→各種フィルタ→PNG
async function preprocess(buf, opts) {
  let pipe = sharp(buf, { failOn: 'none' }).rotate() // EXIF
  if (opts.rotate) pipe = pipe.rotate(opts.rotate)
  const rotated = await pipe.toBuffer()
  let img = sharp(rotated)
  const meta = await img.metadata()
  const w = meta.width || 0
  const h = meta.height || 0
  if (Math.max(w, h) > opts.size) {
    img = img.resize(w >= h ? { width: opts.size } : { height: opts.size })
  }
  if (opts.gray) img = img.grayscale()
  if (opts.normalize) img = img.normalize()
  if (opts.sharpen) img = img.sharpen({ sigma: 1 })
  if (opts.threshold) img = img.threshold(opts.threshold)
  return img.png().toBuffer()
}

async function ocrScore(worker, buf, psm) {
  try {
    await worker.setParameters({ tessedit_pageseg_mode: psm, preserve_interword_spaces: '1' })
    const { data } = await worker.recognize(buf)
    const lines = (data.lines ?? []).map((l) => l.text)
    const { values } = extractLabValues(lines.length ? lines : (data.text ?? '').split('\n'), 'unknown')
    return { n: values.length, conf: Math.round(data.confidence ?? 0), items: values.map((x) => x.displayName), text: data.text ?? '' }
  } catch (e) {
    return { n: -1, conf: 0, items: [], text: '', error: String(e?.message || e).slice(0, 60) }
  }
}

const PSM = { AUTO: '3', SINGLE_COLUMN: '4', SINGLE_BLOCK: '6', SPARSE: '11' }

async function main() {
  const images = listImages()
  if (images.length === 0) {
    console.log(`画像がありません。${SAMPLES} に実画像を置いてください。`)
    return
  }
  const worker = await createWorker(['jpn', 'eng'], 1)

  for (const imgPath of images) {
    console.log(`\n===== ${path.basename(imgPath)} =====`)
    const raw = fs.readFileSync(imgPath)

    // --- Stage A: 最適な回転を探す（gray+norm, size2200, psm6 で固定） ---
    let bestRot = 0
    let bestRotN = -1
    for (const rot of [0, 90, 270, 180]) {
      const pre = await preprocess(raw, { rotate: rot, size: 2200, gray: true, normalize: true })
      const r = await ocrScore(worker, pre, PSM.SINGLE_BLOCK)
      console.log(`  [rot ${String(rot).padStart(3)}] ${String(r.n).padStart(2)}項目 conf${r.conf}`)
      if (r.n > bestRotN) {
        bestRotN = r.n
        bestRot = rot
      }
    }
    console.log(`  => 採用回転: ${bestRot}（${bestRotN}項目）`)

    // --- Stage B: 採用回転で前処理×PSMを総当たり ---
    const variants = []
    for (const size of [2200, 3000]) {
      for (const psm of [PSM.AUTO, PSM.SINGLE_BLOCK, PSM.SINGLE_COLUMN, PSM.SPARSE]) {
        variants.push({ tag: `raw s${size} p${psm}`, psm, o: { rotate: bestRot, size } })
        variants.push({ tag: `gray+norm s${size} p${psm}`, psm, o: { rotate: bestRot, size, gray: true, normalize: true } })
        variants.push({ tag: `gn+sharp s${size} p${psm}`, psm, o: { rotate: bestRot, size, gray: true, normalize: true, sharpen: true } })
        variants.push({ tag: `gn+thr180 s${size} p${psm}`, psm, o: { rotate: bestRot, size, gray: true, normalize: true, threshold: 180 } })
        variants.push({ tag: `gn+sharp+thr160 s${size} p${psm}`, psm, o: { rotate: bestRot, size, gray: true, normalize: true, sharpen: true, threshold: 160 } })
      }
    }
    const results = []
    for (const v of variants) {
      const pre = await preprocess(raw, v.o)
      const r = await ocrScore(worker, pre, v.psm)
      results.push({ tag: v.tag, ...r })
    }
    results.sort((a, b) => b.n - a.n)
    console.log('  --- 上位 ---')
    for (const r of results.slice(0, 12)) console.log(`  ${String(r.n).padStart(2)}項目 conf${String(r.conf).padStart(3)}  ${r.tag}`)
    console.log('  best items:', results[0]?.items?.join(', '))
  }
  await worker.terminate()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
