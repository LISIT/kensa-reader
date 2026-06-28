import { useState } from 'react'
import type { Settings } from '../engine/settings'
import type { EngineId } from '../engine/settings'
import type { OcrProviderId } from '../ocr'
import type { Sex } from '../knowledge/bloodTests'

const OCR_LABEL: Record<OcrProviderId, string> = {
  tesseract: '標準（安定）',
  paddle: 'PaddleOCR（高精度・実験的／重い）',
}

const SEX_LABEL: Record<Sex, string> = { male: '男性', female: '女性', unknown: '未設定' }
const ENGINE_LABEL: Record<EngineId, string> = {
  local: '端末内（おすすめ・キー不要）',
  claude: 'Claude（高精度・要キー）',
  ollama: 'ローカルOllama（要サーバ）',
}

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
          <label>性別（基準値の精度が上がります）</label>
          <div className="radio-row">
            {(['female', 'male', 'unknown'] as Sex[]).map((sx) => (
              <button
                key={sx}
                className={s.sex === sx ? 'active' : ''}
                onClick={() => set({ sex: sx })}
              >
                {SEX_LABEL[sx]}
              </button>
            ))}
          </div>
        </div>

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
          <label>OCR（文字認識）エンジン</label>
          <div className="radio-row">
            {(['tesseract', 'paddle'] as OcrProviderId[]).map((id) => (
              <button
                key={id}
                className={s.ocrProviderId === id ? 'active' : ''}
                onClick={() => set({ ocrProviderId: id })}
              >
                {OCR_LABEL[id]}
              </button>
            ))}
          </div>
          <div className="help">
            通常は「標準」をお使いください。「PaddleOCR」は高精度ですが、端末によっては
            読み込みが重く、うまく動かないことがあります。どちらも端末内で動作し、写真は外部に送りません。
            読み取れない項目は、結果画面で手入力できます。
          </div>
        </div>

        <div className="field">
          <label>解析の種類（通常はこのまま）</label>
          <div className="radio-row">
            {(['local', 'claude', 'ollama'] as EngineId[]).map((id) => (
              <button key={id} className={s.engineId === id ? 'active' : ''} onClick={() => set({ engineId: id })}>
                {ENGINE_LABEL[id]}
              </button>
            ))}
          </div>
          <div className="help">
            既定の「端末内」はキー不要・写真を外部に送りません。家族みんなはこのままでOK。
          </div>
        </div>

        {s.engineId === 'claude' && (
          <div className="card" style={{ background: '#f8fafc' }}>
            <div className="field">
              <label>Claude APIキー</label>
              <input
                type="password"
                value={s.claude.apiKey}
                placeholder="sk-ant-..."
                onChange={(e) => set({ claude: { ...s.claude, apiKey: e.target.value } })}
              />
              <div className="help">端末内のみに保存します。画像はAnthropicに送信されます（同意の上でご利用ください）。</div>
            </div>
            <div className="field">
              <label>モデル</label>
              <input
                value={s.claude.model}
                onChange={(e) => set({ claude: { ...s.claude, model: e.target.value } })}
              />
              <div className="help">例: claude-sonnet-4-6（標準）/ claude-opus-4-8（最高精度）</div>
            </div>
          </div>
        )}

        {s.engineId === 'ollama' && (
          <div className="card" style={{ background: '#f8fafc' }}>
            <div className="field">
              <label>Ollama URL</label>
              <input value={s.ollama.url} onChange={(e) => set({ ollama: { ...s.ollama, url: e.target.value } })} />
            </div>
            <div className="field">
              <label>モデル（vision対応）</label>
              <input value={s.ollama.model} onChange={(e) => set({ ollama: { ...s.ollama, model: e.target.value } })} />
            </div>
          </div>
        )}

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
