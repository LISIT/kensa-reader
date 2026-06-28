import { ResultRow } from './ResultRow'
import type { AnalysisResult, LabValue } from '../engine/types'

const CATEGORY_ORDER = ['血球', '肝臓', '腎臓', '脂質', '糖', '炎症', '電解質', 'その他']

function groupByCategory(values: LabValue[]): [string, LabValue[]][] {
  const map = new Map<string, LabValue[]>()
  for (const v of values) {
    const c = v.category ?? 'その他'
    if (!map.has(c)) map.set(c, [])
    map.get(c)!.push(v)
  }
  return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => [c, map.get(c)!])
}

export function Report({
  result,
  onReset,
}: {
  result: AnalysisResult
  onReset: () => void
}) {
  const groups = groupByCategory(result.values)
  const measured = result.values.filter((v) => v.value !== null)

  return (
    <div>
      <div className="card">
        <h2>📋 やさしいまとめ</h2>
        <p style={{ margin: 0 }}>{result.summary}</p>
      </div>

      {result.warnings.length > 0 && (
        <div className="disclaimer" style={{ marginBottom: 16 }}>
          {result.warnings.map((w, i) => (
            <div key={i} style={{ marginBottom: i < result.warnings.length - 1 ? 6 : 0 }}>
              ⚠️ {w}
            </div>
          ))}
        </div>
      )}

      {measured.length > 0 ? (
        groups.map(([cat, vals]) => (
          <div key={cat}>
            <div className="cat-title">{cat}</div>
            {vals.map((v, i) => (
              <ResultRow key={`${cat}-${i}`} v={v} />
            ))}
          </div>
        ))
      ) : (
        <div className="card center muted">
          検査の数値を読み取れませんでした。
          <br />
          明るい場所で、表が大きく・まっすぐ写るように撮り直してみてください。
        </div>
      )}

      <div className="disclaimer" style={{ marginTop: 16 }}>
        <strong>大切なお願い：</strong> この内容は<strong>診断ではありません</strong>。
        数値が基準値から外れていても、すぐに病気とは限りません。
        反対に範囲内でも安心とは限りません。
        気になることは、<strong>必ず検査を受けた医療機関・主治医にご相談ください</strong>。
        体調が急に悪いときは、ためらわず受診・救急にご連絡ください。
      </div>

      <button className="btn secondary" style={{ marginTop: 16 }} onClick={onReset}>
        別の写真を読み取る
      </button>

      <details style={{ marginTop: 16 }}>
        <summary className="muted small">読み取った文字（確認用）</summary>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', color: '#475569' }}>
          {result.rawText || '(なし)'}
        </pre>
      </details>
    </div>
  )
}
