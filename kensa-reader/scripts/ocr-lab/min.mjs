import Ocr from '@gutenye/ocr-node'
import path from 'node:path'
import url from 'node:url'
const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const p = path.resolve(__dirname, '..', '..', 'samples', 'private', 'sample3-1.JPG')
const ocr = await Ocr.create()
try {
  const lines = await ocr.detect(p)
  console.log('OK lines:', lines.length)
  console.log(lines.slice(0, 8).map((l) => l.text))
} catch (e) {
  console.log('FAIL:', e.message)
}
