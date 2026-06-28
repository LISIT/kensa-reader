import { useState } from 'react'
import { buildPrompt, type DocType } from '../guide/prompts'
import { copyText } from '../guide/ai'

// 共有/AIから戻ってきた後に表示する「あと1ステップ」画面（画像は不要）。
export function SentScreen({ docType, onReset }: { docType: DocType; onReset: () => void }) {
  const [toast, setToast] = useState('')
  const prompt = buildPrompt(docType)

  async function copy() {
    const ok = await copyText(prompt)
    setToast(ok ? 'コピーしました。AIの欄を長押し→ペーストしてください。' : 'コピーできませんでした。')
    window.setTimeout(() => setToast(''), 4000)
  }

  return (
    <div>
      <div className="card">
        <div className="center" style={{ fontSize: '2.6rem' }}>📤✅</div>
        <h2 className="center">写真を送りました</h2>
        <p className="center" style={{ marginTop: 0, fontWeight: 700 }}>あと1ステップで完成です！</p>
        <div className="disclaimer" style={{ background: '#ecfeff', borderColor: '#a5f3fc', color: '#155e75' }}>
          <div style={{ marginBottom: 8 }}>
            <strong>１.</strong> 送った先の<strong>AIの画面</strong>を開きます（写真はもう貼られています）。
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>２.</strong> 文字を入れる欄を<strong>指で長押し</strong>して、出てくる<strong>「ペースト」</strong>を押します。
          </div>
          <div>
            <strong>３.</strong> 質問の文章がはり付くので、<strong>送信（↑）</strong>を押してください。
          </div>
        </div>
        <p className="center muted small" style={{ marginTop: 8 }}>
          ※ 質問文はコピー済みです。貼れないときは下のボタンでもう一度コピーできます。
        </p>
        <button className="btn" onClick={copy}>
          📋 質問文をもう一度コピーする
        </button>
        <button className="btn ghost" style={{ marginTop: 8 }} onClick={onReset}>
          最初から
        </button>
      </div>

      <div className="disclaimer">
        <strong>大切なお願い：</strong> AIの説明は<strong>診断ではありません</strong>。
        気になることは<strong>必ず主治医にご相談ください</strong>。
      </div>

      {toast && (
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
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
