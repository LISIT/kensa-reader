import { DOC_TYPES, type DocType } from '../guide/prompts'

export function TypeSelect({
  imageUrl,
  onSelect,
  onBack,
}: {
  imageUrl: string | null
  onSelect: (t: DocType) => void
  onBack: () => void
}) {
  return (
    <div>
      <div className="card">
        <h2>この写真はどれですか？</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          いちばん近いものを選んでください。あとで変えられます。
        </p>
        {imageUrl && <img className="preview-img" src={imageUrl} alt="選んだ写真" style={{ maxHeight: 180, objectFit: 'contain' }} />}
      </div>

      {DOC_TYPES.map((d) => (
        <button
          key={d.id}
          className="btn secondary"
          style={{ marginBottom: 12, justifyContent: 'flex-start', textAlign: 'left', flexDirection: 'column', alignItems: 'flex-start', gap: 2, paddingTop: 12, paddingBottom: 12 }}
          onClick={() => onSelect(d.id)}
        >
          <span style={{ fontSize: '1.1rem' }}>
            {d.emoji} {d.label}
          </span>
          <span className="muted small" style={{ fontWeight: 400 }}>
            {d.hint}
          </span>
        </button>
      ))}

      <button className="btn ghost" onClick={onBack}>
        ← 写真を選び直す
      </button>
    </div>
  )
}
