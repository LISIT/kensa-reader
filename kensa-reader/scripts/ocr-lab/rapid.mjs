// RapidOCR/PaddleOCR(@gutenye/ocr-node, ONNX) のベースライン評価（前処理なし・元ファイル直読み）。
// detect(boxes) → y座標で行再構成 → 抽出採点。
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import Ocr from '@gutenye/ocr-node'
import { extractLabValues } from './extract.bundle.mjs'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const SAMPLES = path.resolve(__dirname, '..', '..', 'samples', 'private')
const files = process.argv.slice(2)
const list = files.length ? files : fs.readdirSync(SAMPLES).filter((f) => /\.(jpe?g|png)$/i.test(f))

function reconstructRows(lines) {
  const items = lines
    .filter((l) => l.box && l.text)
    .map((l) => {
      const ys = l.box.map((p) => p[1])
      const xs = l.box.map((p) => p[0])
      return { text: l.text, cy: ys.reduce((a, b) => a + b, 0) / ys.length, minX: Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }
    })
  if (!items.length) return []
  items.sort((a, b) => a.cy - b.cy)
  const medH = items.map((i) => i.h).sort((a, b) => a - b)[Math.floor(items.length / 2)] || 20
  const rows = []
  let cur = [], curY = null
  for (const it of items) {
    if (curY === null || Math.abs(it.cy - curY) <= medH * 0.7) {
      cur.push(it); curY = curY === null ? it.cy : (curY * (cur.length - 1) + it.cy) / cur.length
    } else { rows.push(cur); cur = [it]; curY = it.cy }
  }
  if (cur.length) rows.push(cur)
  return rows.map((r) => r.sort((a, b) => a.minX - b.minX).map((i) => i.text).join(' '))
}

const ocr = await Ocr.create()
for (const f of list) {
  const p = path.join(SAMPLES, f)
  if (!fs.existsSync(p)) continue
  let out = `\n===== ${f} =====\n`
  try {
    const start = process.hrtime.bigint()
    const lines = await ocr.detect(p)
    const ms = Number(process.hrtime.bigint() - start) / 1e6
    const rows = reconstructRows(lines)
    const { values } = extractLabValues(rows, 'unknown')
    out += `  行${rows.length} 抽出${values.length}項目 ${Math.round(ms)}ms\n`
    out += '  ' + values.map((v) => `${v.displayName}=${v.value}(${v.flag})`).join(', ') + '\n'
    out += '  --- 再構成行(先頭20) ---\n'
    for (const r of rows.slice(0, 20)) out += '   | ' + r + '\n'
  } catch (e) {
    out += '  ERROR: ' + String(e.message || e).slice(0, 80) + '\n'
  }
  fs.appendFileSync(path.join(__dirname, 'result.txt'), out)
  process.stdout.write(out)
}
process.exit(0)
