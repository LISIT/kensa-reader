import { useState } from 'react'
import type { Settings } from '../engine/settings'
import type { Sex } from '../knowledge/bloodTests'

const SEX_LABEL: Record<Sex, string> = { male: '男性', female: '女性', unknown: '未設定' }

export function SettingsModal({
  settings,
  onSave,
  onClose,
}: {
  settings: Settings
  onSave: (s: Settings) => void
  onClose: () => void
}) {
  const [s, setS] = useState<Settings>(settings)
  const set = (patch: Partial<Settings>) => setS((cur) => ({ ...cur, ...patch }))

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>⚙️ 設定</h2>

        <div className="field">
          <label>文字の大きさ</label>
          <div className="radio-row">
            {([1, 1.25, 1.5] as number[]).map((f) => (
              <button key={f} className={s.fontScale === f ? 'active' : ''} onClick={() => set({ fontScale: f })}>
                {f === 1 ? '標準' : f === 1.25 ? '大' : '特大'}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>性別（数値の目安をより正確にできます）</label>
          <div className="radio-row">
            {(['female', 'male', 'unknown'] as Sex[]).map((sx) => (
              <button key={sx} className={s.sex === sx ? 'active' : ''} onClick={() => set({ sex: sx })}>
                {SEX_LABEL[sx]}
              </button>
            ))}
          </div>
        </div>

        <button className="btn" onClick={() => onSave(s)}>
          保存する
        </button>
        <button className="btn ghost" onClick={onClose}>
          閉じる
        </button>
      </div>
    </div>
  )
}
