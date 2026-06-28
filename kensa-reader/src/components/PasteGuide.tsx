// 「ChatGPT等で、長押し→ペースト→送信」の図解。送るボタンの“手前”で見せる。
export function PasteGuide() {
  return (
    <div>
      {/* 長押し→ペーストの図解 */}
      <div
        style={{
          position: 'relative',
          border: '2px dashed #94a3b8',
          borderRadius: 14,
          background: '#fff',
          padding: '22px 14px 14px',
          textAlign: 'center',
        }}
      >
        <div className="muted small" style={{ position: 'absolute', top: 6, left: 12 }}>
          AIの「文字を入れる欄」
        </div>
        <div style={{ fontSize: '1.9rem' }}>👆</div>
        <div
          style={{
            display: 'inline-block',
            marginTop: 4,
            background: '#0f172a',
            color: '#fff',
            borderRadius: 10,
            padding: '7px 16px',
            fontWeight: 700,
          }}
        >
          📋 ペースト
        </div>
        <div className="muted small" style={{ marginTop: 6 }}>
          欄を<strong>長く押す</strong>と、この「ペースト」が出ます
        </div>
      </div>

      <div className="disclaimer" style={{ background: '#ecfeff', borderColor: '#a5f3fc', color: '#155e75', marginTop: 10 }}>
        <div style={{ marginBottom: 6 }}>
          <strong>①</strong> 写真はもう付いています
        </div>
        <div style={{ marginBottom: 6 }}>
          <strong>②</strong> 文字を入れる欄を <strong>長く押して</strong> →{' '}
          <strong>「ペースト」</strong> で質問を貼る
        </div>
        <div>
          <strong>③</strong> <strong>送信（↑）</strong> を押す
        </div>
      </div>
    </div>
  )
}
