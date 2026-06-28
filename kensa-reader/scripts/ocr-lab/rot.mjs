// 回転した日本語票をPP-OCRが読めるか確認（jimpで回転＝libvips非依存でlib互換）。
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import url from 'node:url'
import { Jimp } from 'jimp'
import Ocr from '@gutenye/ocr-node'
import { extractLabValues } from './extract.bundle.mjs'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const SAMPLES = path.resolve(__dirname, '..', '..', 'samples', 'private')
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'rot-'))
const file = process.argv[2] || 'sample2.JPG'

function rows(lines) {
  const it = lines.filter((l) => l.box && l.text).map((l) => {
    const ys = l.box.map((p) => p[1]), xs = l.box.map((p) => p[0])
    return { t: l.text, cy: ys.reduce((a, b) => a + b) / ys.length, x: Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }
  })
  if (!it.length) return []
  it.sort((a, b) => a.cy - b.cy)
  const mh = it.map((i) => i.h).sort((a, b) => a - b)[Math.floor(it.length / 2)] || 20
  const out = []; let cur = [], cy = null
  for (const i of it) { if (cy === null || Math.abs(i.cy - cy) <= mh * 0.7) { cur.push(i); cy = i.cy } else { out.push(cur); cur = [i]; cy = i.cy } }
  if (cur.length) out.push(cur)
  return out.map((r) => r.sort((a, b) => a.x - b.x).map((i) => i.t).join(' '))
}

const ocr = await Ocr.create()
const base = await Jimp.read(path.join(SAMPLES, file))
for (const rot of [0, 90, 180, 270]) {
  const img = base.clone()
  if (rot) img.rotate(rot) // jimp: 反時計回り。向き総当たりなのでどちらでも可
  const out = path.join(TMP, `r${rot}.jpg`)
  await img.write(out)
  const lines = await ocr.detect(out)
  const rr = rows(lines)
  const { values } = extractLabValues(rr, 'unknown')
  let s = `\n[rot ${rot}] 行${rr.length} 抽出${values.length}項目: ` + values.map((v) => `${v.displayName}=${v.value}`).join(', ') + '\n'
  s += rr.slice(0, 16).map((r) => '   | ' + r).join('\n')
  fs.appendFileSync(path.join(__dirname, 'rot-result.txt'), s + '\n')
  process.stdout.write(s + '\n')
}
fs.rmSync(TMP, { recursive: true, force: true })
process.exit(0)
