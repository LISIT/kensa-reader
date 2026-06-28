// 「送る」ボタンの下に、ChatGPT / Claude / Gemini のアイコンを並べて
// 「この中から選ぶ」と直感的に分かるようにする。ロゴは自作SVG（外部依存なし）。

function ChatGptMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="ChatGPT" role="img">
      <path
        fill="#0f0f0f"
        d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"
      />
    </svg>
  )
}

function ClaudeMark({ size = 30 }: { size?: number }) {
  // Anthropic/Claude のオレンジ色の放射バースト（近似）
  const rays = Array.from({ length: 12 }, (_, i) => (i * 360) / 12)
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Claude" role="img">
      <g stroke="#D97757" strokeWidth="1.9" strokeLinecap="round">
        {rays.map((deg) => {
          const r = (deg * Math.PI) / 180
          const x = 12 + 9 * Math.sin(r)
          const y = 12 - 9 * Math.cos(r)
          return <line key={deg} x1="12" y1="12" x2={x.toFixed(2)} y2={y.toFixed(2)} />
        })}
      </g>
    </svg>
  )
}

function GeminiMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Gemini" role="img">
      <defs>
        <linearGradient id="gemini-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4796E3" />
          <stop offset="50%" stopColor="#9177C7" />
          <stop offset="100%" stopColor="#D56F76" />
        </linearGradient>
      </defs>
      <path
        fill="url(#gemini-g)"
        d="M12 2c.4 4.6 4.4 8.6 9 9-4.6.4-8.6 4.4-9 9-.4-4.6-4.4-8.6-9-9 4.6-.4 8.6-4.4 9-9z"
      />
    </svg>
  )
}

export function AiLogos() {
  return (
    <div style={{ textAlign: 'center', marginTop: 8 }}>
      <div className="muted small" style={{ marginBottom: 4 }}>
        押すと、この中から選びます👇
      </div>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center' }}>
        <span title="ChatGPT">
          <ChatGptMark />
        </span>
        <span title="Claude">
          <ClaudeMark />
        </span>
        <span title="Gemini">
          <GeminiMark />
        </span>
        <span className="muted small" style={{ fontWeight: 600 }}>
          から選択
        </span>
      </div>
    </div>
  )
}
