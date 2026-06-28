export function DisclaimerGate({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="card">
      <h2>はじめにお読みください</h2>
      <div className="disclaimer" style={{ marginBottom: 16 }}>
        <p style={{ marginTop: 0 }}>
          このアプリは、検査結果を<strong>わかりやすくするお手伝い</strong>をするものです。
        </p>
        <ul style={{ paddingLeft: '1.2em', margin: '8px 0' }}>
          <li>
            <strong>医療機器ではありません。</strong>診断や治療の判断には使えません。
          </li>
          <li>表示される内容は「参考情報」であり、正しさを保証しません。</li>
          <li>
            気になることは、<strong>必ず主治医・医療機関にご相談ください。</strong>
          </li>
          <li>体調が急に悪いときは、ためらわず受診・救急にご連絡ください。</li>
        </ul>
        <p style={{ marginBottom: 0 }} className="small">
          ※ 既定では、写真は<strong>あなたの端末の中だけ</strong>で処理され、外部に送信されません。
        </p>
      </div>
      <button className="btn" onClick={onAccept}>
        理解しました・はじめる
      </button>
    </div>
  )
}

export function DisclaimerFooter() {
  return (
    <div className="disclaimer-footer">
      ⚠️ これは医療機器ではありません。診断は必ず医師にご相談ください。
    </div>
  )
}
