import { useEffect, useRef, useState } from 'react'
import { getEngine } from './engine'
import type { AnalysisResult } from './engine/types'
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type Settings } from './engine/settings'
import { DisclaimerFooter, DisclaimerGate } from './components/Disclaimer'
import { Report } from './components/Report'
import { SettingsModal } from './components/Settings'

type Screen = 'home' | 'analyzing' | 'report' | 'error'

export function App() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [screen, setScreen] = useState<Screen>('home')
  const [showSettings, setShowSettings] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMsg, setProgressMsg] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const photoRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  // 初回ロード
  useEffect(() => setSettings(loadSettings()), [])

  // 文字サイズ反映
  useEffect(() => {
    document.documentElement.style.setProperty('--fs', String(settings.fontScale))
  }, [settings.fontScale])

  const persist = (s: Settings) => {
    setSettings(s)
    saveSettings(s)
  }

  const acceptDisclaimer = () => persist({ ...settings, disclaimerAccepted: true })

  async function handleFile(file: File) {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(URL.createObjectURL(file))
    setScreen('analyzing')
    setProgress(0)
    setProgressMsg('準備しています…')
    setError('')

    const engine = getEngine(settings.engineId)
    try {
      if (settings.engineId !== 'local' && !(await engine.isAvailable())) {
        throw new Error(
          settings.engineId === 'claude'
            ? 'Claude のAPIキーが未設定、または無効です。設定画面をご確認ください。'
            : 'ローカルOllamaに接続できません。サーバが起動しているかご確認ください。',
        )
      }
      const r = await engine.analyzeBloodTest(file, {
        sex: settings.sex,
        onProgress: (p, m) => {
          setProgress(p)
          if (m) setProgressMsg(m)
        },
      })
      setResult(r)
      setScreen('report')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setScreen('error')
    }
  }

  function reset() {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setResult(null)
    setScreen('home')
    if (photoRef.current) photoRef.current.value = ''
    if (cameraRef.current) cameraRef.current.value = ''
  }

  return (
    <div className="app">
      <div className="appbar">
        <h1>やさしい検査結果リーダー</h1>
        <button className="gear" aria-label="設定" onClick={() => setShowSettings(true)}>
          ⚙️
        </button>
      </div>

      {/* iOS Safari対策: input は display:none ではなく visually-hidden にし、
          label[for] でネイティブのピッカーを開く。ライブラリ選択には capture を付けない。 */}
      <input
        ref={photoRef}
        id="file-photo"
        className="visually-hidden"
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />
      <input
        ref={cameraRef}
        id="file-camera"
        className="visually-hidden"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />

      {screen === 'home' && !settings.disclaimerAccepted && <DisclaimerGate onAccept={acceptDisclaimer} />}

      {screen === 'home' && settings.disclaimerAccepted && (
        <>
          <div className="card">
            <h2>血液検査の結果を読み取ります</h2>
            <p className="muted" style={{ marginTop: 0 }}>
              スマホで撮った検査結果の写真や、スクリーンショットを選んでください。
              数値をやさしい言葉で説明します。
            </p>
            <label htmlFor="file-photo" className="btn" role="button">
              🖼️ 写真をえらぶ
            </label>
            <label htmlFor="file-camera" className="btn secondary" role="button" style={{ marginTop: 10 }}>
              📷 カメラで撮る
            </label>
            <p className="help center" style={{ marginTop: 12 }}>
              いまの読み取り方法：<strong>{getEngine(settings.engineId).label}</strong>
            </p>
          </div>

          <div className="card">
            <h2>📌 上手に撮るコツ</h2>
            <ul style={{ paddingLeft: '1.2em', margin: 0 }}>
              <li>明るい場所で、影が入らないように。</li>
              <li>数値の表が、まっすぐ・大きく写るように。</li>
              <li>ピントを合わせてから撮影してください。</li>
            </ul>
          </div>
        </>
      )}

      {screen === 'analyzing' && (
        <div className="card">
          <div className="progress-wrap">
            <div className="spinner">🔎</div>
            <p style={{ fontWeight: 700 }}>{progressMsg || '読み取っています…'}</p>
            <div className="bar">
              <span style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <p className="muted small">写真はこの端末の中で処理されます（既定）。少しお待ちください。</p>
          </div>
          {preview && <img className="preview-img" src={preview} alt="選んだ写真" />}
        </div>
      )}

      {screen === 'report' && result && <Report result={result} onReset={reset} />}

      {screen === 'error' && (
        <div className="card">
          <h2>うまく読み取れませんでした</h2>
          <div className="disclaimer" style={{ marginBottom: 16 }}>
            {error}
          </div>
          {preview && <img className="preview-img" src={preview} alt="選んだ写真" />}
          <button className="btn secondary" style={{ marginTop: 16 }} onClick={reset}>
            もう一度ためす
          </button>
        </div>
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={(s) => {
            persist(s)
            setShowSettings(false)
          }}
          onClose={() => setShowSettings(false)}
        />
      )}

      <DisclaimerFooter />
    </div>
  )
}
