import { useState } from 'react'
import type { LabValue } from '../engine/types'
import { lookupGlossary } from '../knowledge/glossary'

const FLAG_LABEL: Record<LabValue['flag'], string> = {
  high: '基準値より高め',
  low: '基準値より低め',
  normal: '範囲内',
  unknown: '判定なし',
}

function Gauge({ value, low, high }: { value: number; low?: number; high?: number }) {
  if (low === undefined || high === undefined || high <= low) return null
  const span = (high - low) * 0.6 || 1
  const axisMin = low - span
  const axisMax = high + span
  const pct = (x: number) => Math.max(0, Math.min(100, ((x - axisMin) / (axisMax - axisMin)) * 100))
  return (
    <div className="gauge" aria-hidden>
      <div className="normal-zone" style={{ left: `${pct(low)}%`, right: `${100 - pct(high)}%` }} />
      <div className="marker" style={{ left: `${pct(value)}%` }} />
    </div>
  )
}

export function ResultRow({ v }: { v: LabValue }) {
  const [open, setOpen] = useState(false)
  const unitTip = v.unit ? lookupGlossary(v.unit) : undefined
  const range = v.usedRange
  const rangeText =
    range && (range.low !== undefined || range.high !== undefined)
      ? `基準値の目安: ${range.low ?? '〜'}〜${range.high ?? ''}${v.unit ? ' ' + v.unit : ''}` +
        (range.source === 'knowledge' ? '（一般的な目安）' : '（用紙の値）')
      : null

  return (
    <div className={`result ${v.flag}`}>
      <div className="result-head">
        <span className="result-name">{v.displayName}</span>
        <span className="result-value">
          {v.value}
          {v.unit && <span className="unit">{v.unit}</span>}
        </span>
      </div>

      <span className={`badge ${v.flag}`}>{FLAG_LABEL[v.flag]}</span>

      {v.value !== null && <Gauge value={v.value} low={range?.low} high={range?.high} />}
      {rangeText && <div className="range-text">{rangeText}</div>}

      {v.flagMeaning && <div className="flag-meaning">{v.flagMeaning}</div>}

      <button className="btn ghost" style={{ marginTop: 6 }} onClick={() => setOpen((o) => !o)}>
        {open ? '閉じる' : 'この項目は何？'}
      </button>
      {open && (
        <div className="about">
          {v.about && <p style={{ marginTop: 0 }}>{v.about}</p>}
          {unitTip && (
            <p className="small muted" style={{ marginBottom: 0 }}>
              単位「{v.unit}」… {unitTip.plain}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
