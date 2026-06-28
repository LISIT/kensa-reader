import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { buildPrompt, getDocType, type DocType } from '../guide/prompts'
import { AI_TARGETS, copyText, downloadImage, shareImage, shareNative, isNativeApp } from '../guide/ai'
import { enhanceImage, type EnhancedImage } from '../guide/enhance'

export function Handoff({
  image,
  docType,
  onBack,
  onReset,
  onShared,
  onLocalAnalyze,
}: {
  image: Blob
  docType: DocType
  onBack: () => void
  onReset: () => void
  onShared: () => void
  onLocalAnalyze?: () => void
}) {
  const [rotate, setRotate] = useState(0)
  const [enhanced, setEnhanced] = useState<EnhancedImage | null>(null)
  const [toast, setToast] = useState('')
  const [showPrompt, setShowPrompt] = useState(false)

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

  // ★方針: 「共有/AIへ渡したら、戻って続きをやる」設計はやめる。
  //   渡した瞬間に静的な「送信しました」完了画面へ切り替え、待機/処理を一切残さない
  //   （iOSの共有後フリーズが起きても、固まって見えるUIを残さないため）。
  //   - クリップボードへのコピーは操作中（共有/オープンの前）に即時発火＝貼り付け可能に。

  function openAi(url: string) {
    void copyText(prompt)
    flushSync(() => onShared()) // 先に完了画面を同期描画
    window.open(url, '_blank', 'noopener')
  }

  function shareAll() {
    if (!enhanced) return
    const blob = enhanced.blob
    if (isNativeApp()) {
      // ★ネイティブ共有: 画像＋質問文を一度に渡す。WebViewのフリーズが無いので
      //   共有が終わってから（または並行して）完了画面へ。アプリは応答したまま。
      void shareNative(blob, prompt).then(() => onShared())
      return
    }
    // Web(プロトタイプ): 質問文をコピー → 完了画面を同期描画 → 画像のみ共有
    void copyText(prompt)
    flushSync(() => onShared())
    void shareImage(blob)
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
