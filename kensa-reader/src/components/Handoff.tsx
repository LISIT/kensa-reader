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

  async function openAi(url: string) {
    await copyText(prompt)
    flash('質問文をコピーしました。開いた画面に「写真」をはり付けて、長押し→ペーストで質問文をはり付けて送ってください。')
    window.open(url, '_blank', 'noopener')
  }

  async function shareAll() {
    if (!enhanced) return
    await copyText(prompt) // 質問文は先にコピー（共有は画像のみ＝多くのAIアプリが候補に出る）
    const r = await shareImage(enhanced.blob)
    if (r === 'shared') {
      setSent(true)
    } else if (r === 'unsupported') {
      flash('この端末では「まとめて送る」が使えません。下の「写真を保存」と各ボタンをお使いください。')
    } else {
      flash('送れませんでした。下の「写真を保存」と各ボタンをお試しください。')
    }
  }

  if (sent) {
    return (
      <div>
        <div className="card center">
          <div style={{ fontSize: '3rem' }}>📤✅</div>
          <h2>写真を送りました</h2>
          <p style={{ marginTop: 0 }}>
            送った先の<strong>AIの画面</strong>で、入力欄を<strong>長押し →「ペースト」</strong>で
            質問文をはり付けて、送信してください。
          </p>
          <button
            className="btn"
            onClick={async () => {
              const ok = await copyText(prompt)
              flash(ok ? '質問文をもう一度コピーしました。' : 'コピーできませんでした。')
            }}
          >
            📋 質問文をもう一度コピー
          </button>
          <button className="btn secondary" style={{ marginTop: 10 }} onClick={() => setSent(false)}>
            ← 送る画面にもどる（別のAIにも送れます）
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
