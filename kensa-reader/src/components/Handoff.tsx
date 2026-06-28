import { useEffect, useState } from 'react'
import { buildPrompt, getDocType, type DocType } from '../guide/prompts'
import { AI_TARGETS, copyText, downloadImage, shareImage } from '../guide/ai'
import { enhanceImage, type EnhancedImage } from '../guide/enhance'

export function Handoff({
  image,
  docType,
  onBack,
  onReset,
  onLocalAnalyze,
}: {
  image: Blob
  docType: DocType
  onBack: () => void
  onReset: () => void
  onLocalAnalyze?: () => void
}) {
  const [rotate, setRotate] = useState(0)
  const [enhanced, setEnhanced] = useState<EnhancedImage | null>(null)
  const [toast, setToast] = useState('')
  const [showPrompt, setShowPrompt] = useState(false)
  const [sent, setSent] = useState(false)

  const info = getDocType(docType)
  const prompt = buildPrompt(docType)

  useEffect(() => {
    let url: string | null = null
    let alive = true
    enhanceImage(image, { rotate }).then((e) => {
      if (!alive) {
        URL.revokeObjectURL(e.url)
        return
      }
      setEnhanced((prev) => {
        if (prev) URL.revokeObjectURL(prev.url)
        return e
      })
      url = e.url
    })
    return () => {
      alive = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [image, rotate])

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(''), 4000)
  }

  // ★iOS対策: 操作の有効性(transient activation)を保つため、
  //   activationが要る window.open / navigator.share を「最初に」呼び、コピーは後にする。
  function openAi(url: string) {
    window.open(url, '_blank', 'noopener')
    void copyText(prompt).then(() =>
      flash('質問文をコピーしました。開いた画面に写真をはり付け、入力欄を長押し→ペーストで質問文をはり付けて送ってください。'),
    )
  }

  function shareAll() {
    if (!enhanced) return
    shareImage(enhanced.blob).then((r) => {
      if (r === 'shared') {
        setSent(true)
        void copyText(prompt)
      } else if (r === 'unsupported') {
        flash('この端末では「まとめて送る」が使えません。下の「写真を保存」と各ボタンをお使いください。')
      } else {
        flash('送れませんでした。下の「写真を保存」と各ボタンをお試しください。')
      }
    })
  }

  if (sent) {
    return (
      <div>
        <div className="card">
          <div className="center" style={{ fontSize: '2.6rem' }}>📤✅</div>
          <h2 className="center">写真を送りました</h2>
          <p className="center" style={{ marginTop: 0, fontWeight: 700 }}>あと1ステップで完成です！</p>
          <div className="disclaimer" style={{ background: '#ecfeff', borderColor: '#a5f3fc', color: '#155e75' }}>
            <div style={{ marginBottom: 8 }}>
              <strong>１.</strong> 送った先の<strong>AIの画面</strong>が開きます（写真はもう貼られています）。
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>２.</strong> 文字を入れる欄を<strong>指で長押し</strong>して、出てくる<strong>「ペースト」</strong>を押します。
            </div>
            <div>
              <strong>３.</strong> 質問の文章がはり付くので、<strong>送信（↑）</strong>を押してください。
            </div>
          </div>
          <p className="center muted small" style={{ marginTop: 8 }}>
            ※ 質問文はコピー済みです。「ペースト」で貼れます。
          </p>
          <button
            className="btn"
            onClick={async () => {
              const ok = await copyText(prompt)
              flash(ok ? 'もう一度コピーしました。AIの欄で長押し→ペーストしてください。' : 'コピーできませんでした。')
            }}
          >
            📋 質問文をもう一度コピーする
          </button>
          <button className="btn secondary" style={{ marginTop: 10 }} onClick={() => setSent(false)}>
            ← 送る画面にもどる
          </button>
          <button className="btn ghost" style={{ marginTop: 4 }} onClick={onReset}>
            最初から
          </button>
        </div>

        <div className="disclaimer">
          <strong>大切なお願い：</strong> AIの説明は<strong>診断ではありません</strong>。
          気になることは<strong>必ず主治医にご相談ください</strong>。
        </div>

        {toast && <Toast text={toast} />}
      </div>
    )
  }

  return (
    <div>
      <div className="card">
        <h2>
          {info.emoji} やさしい説明をもらいましょう
        </h2>
        <p className="muted" style={{ marginTop: 0 }}>
          下のボタンから、写真と質問をAIに送ると、やさしい言葉で説明してくれます。
        </p>

        {enhanced ? (
          <img className="preview-img" src={enhanced.url} alt="検査の写真" />
        ) : (
          <div className="center muted" style={{ padding: 24 }}>写真を準備しています…</div>
        )}
        <button className="btn ghost" onClick={() => setRotate((r) => (r + 90) % 360)}>
          🔄 写真をまわす（向きがおかしいとき）
        </button>
      </div>

      <div className="card">
        <h2>① 写真と質問をまとめて送る</h2>
        <p className="muted small" style={{ marginTop: 0 }}>
          かんたんです。送り先で「ChatGPT」などを選べます。
        </p>
        <button className="btn" onClick={shareAll} disabled={!enhanced}>
          📤 写真と質問をまとめて送る
        </button>
      </div>

      <div className="card">
        <h2>② うまくいかないときは、AIを選ぶ</h2>
        <p className="muted small" style={{ marginTop: 0 }}>
          ボタンを押すと質問文がコピーされ、AIの画面が開きます。あとは<strong>写真をはり付け</strong>、
          <strong>長押し→ペースト</strong>で質問文をはり付けて送ってください。
        </p>
        {AI_TARGETS.map((t) => (
          <button key={t.id} className="btn secondary" style={{ marginBottom: 10 }} onClick={() => openAi(t.url)}>
            {t.emoji} {t.label}で説明してもらう
          </button>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button className="btn ghost" style={{ flex: 1 }} onClick={() => enhanced && downloadImage(enhanced.blob)} disabled={!enhanced}>
            💾 写真を保存
          </button>
          <button
            className="btn ghost"
            style={{ flex: 1 }}
            onClick={async () => {
              const ok = await copyText(prompt)
              flash(ok ? '質問文をコピーしました。' : 'コピーできませんでした。下の文章を長押しでコピーしてください。')
            }}
          >
            📋 質問文をコピー
          </button>
        </div>

        <button className="btn ghost" onClick={() => setShowPrompt((s) => !s)} style={{ marginTop: 4 }}>
          {showPrompt ? '質問文を閉じる' : '送る質問文を見る'}
        </button>
        {showPrompt && (
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', background: '#f8fafc', padding: 12, borderRadius: 12, color: '#334155' }}>
            {prompt}
          </pre>
        )}
      </div>

      {onLocalAnalyze && docType === 'blood' && (
        <button className="btn ghost" onClick={onLocalAnalyze} style={{ marginBottom: 8 }}>
          （AIを使わずに）アプリだけで数値を見る
        </button>
      )}

      <div className="disclaimer" style={{ marginTop: 8 }}>
        <strong>大切なお願い：</strong> AIの説明は<strong>診断ではありません</strong>。
        参考にとどめ、気になることは<strong>必ず主治医にご相談ください</strong>。
        急な体調不良のときは、ためらわず受診・救急にご連絡ください。
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="btn ghost" style={{ flex: 1 }} onClick={onBack}>
          ← 種類を選び直す
        </button>
        <button className="btn ghost" style={{ flex: 1 }} onClick={onReset}>
          最初から
        </button>
      </div>

      {toast && <Toast text={toast} />}
    </div>
  )
}

function Toast({ text }: { text: string }) {
  return (
    <div
      style={{
        position: 'fixed',
        left: 16,
        right: 16,
        bottom: 'calc(56px + env(safe-area-inset-bottom))',
        background: '#0f172a',
        color: '#fff',
        padding: '12px 16px',
        borderRadius: 12,
        zIndex: 20,
        fontSize: '0.92rem',
        boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
      }}
    >
      {text}
    </div>
  )
}
