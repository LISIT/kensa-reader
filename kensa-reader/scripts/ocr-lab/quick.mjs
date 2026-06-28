// 絞り込み確認: 指定画像を少数の前処理で読み、抽出項目を表示。
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import sharp from 'sharp'
import { createWorker } from 'tesseract.js'
import { extractLabValues } from './extract.bundle.mjs'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const SAMPLES = path.resolve(__dirname, '..', '..', 'samples', 'private')
const files = process.argv.slice(2)

async function pre(buf, { size = 2200, gray = true, normalize = true, sharpen = false, threshold = 0 }) {
  let pipe = sharp(buf, { failOn: 'none' }).rotate()
  const meta = await pipe.metadata()
  if (Math.max(meta.width, meta.height) > size) pipe = pipe.resize(meta.width >= meta.height ? { width: size } : { height: size })
  if (gray) pipe = pipe.grayscale()
  if (normalize) pipe = pipe.normalize()
  if (sharpen) pipe = pipe.sharpen({ sigma: 1 })
  if (threshold) pipe = pipe.threshold(threshold)
  return pipe.png().toBuffer()
}

const w = await createWorker(['jpn', 'eng'], 1)
for (const f of files) {
  const p = path.join(SAMPLES, f)
  if (!fs.existsSync(p)) { console.log('not found:', f); continue }
  const raw = fs.readFileSync(p)
  console.log(`\n===== ${f} =====`)
  for (const [tag, opts, psm] of [
    ['gray+norm p3', { gray: true, normalize: true }, '3'],
    ['gray+norm p6', { gray: true, normalize: true }, '6'],
    ['gray+norm+sharp p6', { gray: true, normalize: true, sharpen: true }, '6'],
  ]) {
    try {
      const buf = await pre(raw, opts)
      await w.setParameters({ tessedit_pageseg_mode: psm, preserve_interword_spaces: '1' })
      const { data } = await w.recognize(buf)
      const lines = (data.lines ?? []).map((l) => l.text)
      const { values } = extractLabValues(lines.length ? lines : (data.text ?? '').split('\n'), 'unknown')
      console.log(`  [${tag}] ${values.length}項目 conf${Math.round(data.confidence)}: ${values.map((v) => `${v.displayName}=${v.value}(${v.flag})`).join(', ')}`)
    } catch (e) {
      console.log(`  [${tag}] ERROR ${String(e.message || e).slice(0, 50)}`)
    }
  }
}
await w.terminate()
