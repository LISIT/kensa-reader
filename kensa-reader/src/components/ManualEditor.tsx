import { useMemo, useState } from 'react'
import type { AnalysisResult, LabValue } from '../engine/types'
import type { Sex } from '../knowledge/bloodTests'
import { addableItems, createManualValue, recomputeValue, rebuildResult } from '../engine/manual'

const FLAG_LABEL: Record<LabValue['flag'], string> = {
  high: '高め',
  low: '低め',
  normal: '範囲内',
  unknown: '—',
}

export function ManualEditor({
  result,
  sex,
  onSave,
  onCancel,
}: {
  result: AnalysisResult
  sex: Sex
  onSave: (r: AnalysisResult) => void
  onCancel: () => void
}) {
  // 各行を {value, text} で管理（textは入力中の文字列）
  const [rows, setRows] = useState<{ v: LabValue; text: string }[]>(
    result.values.map((v) => ({ v, text: v.value === null ? '' : String(v.value) })),
  )
  const [addId, setAddId] = useState('')
  const [addText, setAddText] = useState('')

  const addable = useMemo(() => addableItems(rows.map((r) => r.v)), [rows])

  function updateText(i: number, text: string) {
    setRows((rs) => {
      const next = [...rs]
      const num = parseFloat(text)
      const v = Number.isFinite(num) ? recomputeValue(next[i].v, num, sex) : { ...next[i].v, value: null }
      next[i] = { v, text }
      return next
    })
  }

  function remove(i: number) {
    setRows((rs) => rs.filter((_, idx) => idx !== i))
  }

  function add() {
    const num = parseFloat(addText)
    if (!addId || !Number.isFinite(num)) return
    const v = createManualValue(addId, num, sex)
    if (!v) return
    setRows((rs) => [...rs, { v, text: String(num) }])
    setAddId('')
    setAddText('')
  }

  function save() {
    const values = rows.filter((r) => r.v.value !== null).map((r) => r.v)
    onSave(rebuildResult(result, values))
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>✏️ 数値の確認・修正・追加</h2>
        <p className="help" style={{ marginTop: 0 }}>
          読み取った数値が違うときは直してください。読み取れなかった項目は下で追加できます。
          基準値による「高め／低め」は自動で計算し直します。
        </p>

        {rows.map((r, i) => (
          <div className="field" key={`${r.v.itemId ?? r.v.rawName}-${i}`}>
            <label>
              {r.v.displayName}
              {r.v.unit ? <span className="muted small">（{r.v.unit}）</span> : null}
            </label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="number"
                inputMode="decimal"
                value={r.text}
                onChange={(e) => updateText(i, e.target.value)}
                style={{ flex: 1 }}
              />
              <span className={`badge ${r.v.flag}`} style={{ minWidth: 64, textAlign: 'center' }}>
                {FLAG_LABEL[r.v.flag]}
              </span>
              <button className="btn ghost" style={{ width: 'auto', minHeight: 44 }} onClick={() => remove(i)}>
                削除
              </button>
            </div>
          </div>
        ))}

        <div className="card" style={{ background: '#f8fafc' }}>
          <label style={{ fontWeight: 700 }}>項目を追加する</label>
          <div className="field" style={{ marginTop: 8, marginBottom: 8 }}>
            <select value={addId} onChange={(e) => setAddId(e.target.value)}>
              <option value="">— 検査項目をえらぶ —</option>
              {addable.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.displayName}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="number"
              inputMode="decimal"
              placeholder="数値"
              value={addText}
              onChange={(e) => setAddText(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn secondary" style={{ width: 'auto' }} onClick={add} disabled={!addId || addText === ''}>
              追加
            </button>
          </div>
        </div>

        <button className="btn" onClick={save}>
          保存してレポートを更新
        </button>
        <button className="btn ghost" onClick={onCancel}>
          キャンセル
        </button>
      </div>
    </div>
  )
}
