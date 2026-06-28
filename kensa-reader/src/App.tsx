import { useEffect, useRef, useState } from 'react'
import { getEngine } from './engine'
import type { AnalysisResult } from './engine/types'
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type Settings } from './engine/settings'
import { DisclaimerFooter, DisclaimerGate } from './components/Disclaimer'
import { TypeSelect } from './components/TypeSelect'
import { Handoff } from './components/Handoff'
import { Report } from './components/Report'
import { SettingsModal } from './components/Settings'
import type { DocType } from './guide/prompts'

type Screen = 'home' | 'type' | 'handoff' | 'analyzing' | 'report'

export function App() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [screen, setScreen] = useState<Screen>('home')
  const [showSettings, setShowSettings] = useState(false)
  const [image, setImage] = useState<Blob | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [docType, setDocType] = useState<DocType>('blood')
  const [progress, setProgress] = useState(0)
  const [progressMsg, setProgressMsg] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')
  const photoRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const [, setTick] = useState(0)

  useEffect(() => setSettings(loadSettings()), [])
  useEffect(() => {
    document.documentElement.style.setProperty('--fs', String(settings.fontScale))
  }, [settings.fontScale])

  // iOS対策: 共有/外部アプリから戻った直後にタッチが効かなくなることがあるため、
  // 復帰時にリフロー（pointer-events トグル＋微小スクロール）でイベント処理を立て直す。
  useEffect(() => {
    const wake = () => {
      try {
        document.body.style.pointerEvents = 'none'
        void document.body.offsetHeight // 強制リフロー
        document.body.style.pointerEvents = ''
        window.scrollBy(0, 1)
        window.scrollBy(0, -1)
      } catch {
        /* noop */
      }
      setTick((t) => t + 1)
    }
    window.addEventListener('pageshow', wake)
    window.addEventListener('focus', wake)
    document.addEventListener('visibilitychange', wake)
    return () => {
      window.removeEventListener('pageshow', wake)
      window.removeEventListener('focus', wake)
      document.removeEventListener('visibilitychange', wake)
    }
  }, [])

  const persist = (s: Settings) => {
    setSettings(s)
    saveSettings(s)
  }
  const acceptDisclaimer = () => persist({ ...settings, disclaimerAccepted: true })

  function pickImage(file: File) {
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    setImage(file)
    setImageUrl(URL.createObjectURL(file))
    setDocType('blood')
    setError('')
    setResult(null)
    setScreen('type')
  }

  function reset() {
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    setImage(null)
    setImageUrl(null)
    setResult(null)
    setError('')
    setScreen('home')
    if (photoRef.current) photoRef.current.value = ''
    if (cameraRef.current) cameraRef.current.value = ''
  }

  async function runLocalAnalyze() {
    if (!image) return
    setScreen('analyzing')
    setProgress(0)
    setProgressMsg('準備しています…')
    try {
      const engine = getEngine('local')
      const r = await engine.analyzeBloodTest(image, {
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
      setScreen('handoff')
    }
  }

  return (
    <div className="app">
      <div className="appbar">
        <h1>やさしい検査結果リーダー</h1>
        <button className="gear" aria-label="設定" onClick={() => setShowSettings(true)}>
          ⚙️
        </button>
      </div>

      <input
        ref={photoRef}
        id="file-photo"
        className="visually-hidden"
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) pickImage(f)
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
          if (f) pickImage(f)
        }}
      />

      {screen === 'home' && !settings.disclaimerAccepted && <DisclaimerGate onAccept={acceptDisclaimer} />}

      {screen === 'home' && settings.disclaimerAccepted && (
        <>
          <div className="card">
            <h2>検査結果を、やさしく説明します</h2>
            <p className="muted" style={{ marginTop: 0 }}>
              病院でもらった検査結果・お薬・紹介状などの写真を撮るか選ぶと、
              やさしい言葉での説明をもらえるようにお手伝いします。
            </p>
            <label htmlFor="file-camera" className="btn" role="button">
              📷 写真を撮る
            </label>
            <label htmlFor="file-photo" className="btn secondary" role="button" style={{ marginTop: 10 }}>
              🖼️ 写真をえらぶ
            </label>
          </div>

          <div className="card">
            <h2>📌 上手に撮るコツ</h2>
            <ul style={{ paddingLeft: '1.2em', margin: 0 }}>
              <li>明るい場所で、影が入らないように。</li>
              <li>書類が、まっすぐ・大きく写るように。</li>
              <li>ピントを合わせてから撮影してください。</li>
            </ul>
          </div>
        </>
      )}

      {screen === 'type' && (
        <TypeSelect imageUrl={imageUrl} onSelect={(t) => { setDocType(t); setScreen('handoff') }} onBack={reset} />
      )}

      {screen === 'handoff' && image && (
        <>
          {error && (
            <div className="disclaimer" style={{ marginBottom: 12 }}>
              うまく読み取れませんでした：{error}
            </div>
          )}
          <Handoff
            image={image}
            docType={docType}
            onBack={() => setScreen('type')}
            onReset={reset}
            onLocalAnalyze={runLocalAnalyze}
          />
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
            <p className="muted small">写真はこの端末の中で処理されます。少しお待ちください。</p>
          </div>
          {imageUrl && <img className="preview-img" src={imageUrl} alt="選んだ写真" />}
        </div>
      )}

      {screen === 'report' && result && (
        <Report
          result={result}
          sex={settings.sex}
          onReset={reset}
          onResultChange={setResult}
        />
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
