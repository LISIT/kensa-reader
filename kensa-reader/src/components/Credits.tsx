// クレジット（フッター）。バランスと行間を整えた控えめな表示。
export function Credits() {
  return (
    <footer style={{ textAlign: 'center', padding: '28px 12px 12px', lineHeight: 1.5 }}>
      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--teal)', letterSpacing: '0.02em' }}>
        AI Health Navigator
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 2 }}>Open Source Project</div>

      <div style={{ width: 40, height: 1, background: 'var(--line)', margin: '18px auto' }} />

      <div
        style={{
          fontSize: '0.7rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#94a3b8',
        }}
      >
        Developed by
      </div>
      <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#334155', marginTop: 3 }}>
        Shuji Yamamoto, PhD
      </div>

      <div style={{ marginTop: 18, fontSize: '0.92rem', fontWeight: 600, color: '#334155' }}>
        Institute of One
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 2 }}>
        Supported by LISIT Co., Ltd.
      </div>
    </footer>
  )
}
