# やさしい検査結果リーダー (kensa-reader)

スマホで撮った **血液検査の結果** を、やさしい日本語で説明する PWA（Webアプリ）。
PCを使わないご家族でも、URLを開くだけで使えます。

> ⚠️ **非薬事・医療機器ではありません**
> このアプリは診断・治療の判断に使えません。表示はすべて「参考情報」です。
> **気になることは必ず主治医・医療機関にご相談ください。** 体調が急に悪いときはためらわず受診を。

---

## 特長

- **インストール不要** — スマホのブラウザでURLを開くだけ。ホーム画面に追加も可能。
- **APIキー不要（既定）** — 既定エンジンはブラウザ内で完結。**写真は端末から外に出ません。**
- **運用費ゼロ** — GitHub Pages 等の無料静的ホスティングで配布できます。
- **正確な判定** — 用紙に印字された基準値を読み取れたら、それを優先して「高い/低い/範囲内」を判定。
- **やさしいUI** — 大きな文字、3ステップ、色分け、用語のタップ解説。

## しくみ（既定エンジン）

```
写真/スクショ → 端末内OCR(Tesseract.js) → 項目・数値・基準値を抽出
            → 内蔵ナレッジで判定&やさしい説明 → レポート表示
```

数値の判定は LLM に頼らず、**OCR + 基準値ナレッジ**で決定論的に行うため、ブレません。
「もっと自然な説明文」が欲しい人だけ、設定で **Claude** や **ローカル Ollama** に切り替えられます
（Claude は画像が Anthropic に送信されます／Ollama は送信なしだが自宅サーバが必要）。

## 開発

```powershell
cd kensa-reader
npm install
npm run dev        # 開発サーバ (http://localhost:5173)
npm run build      # 本番ビルド (dist/)
npm run preview    # ビルド結果の確認
```

> OCRモデルは初回のみ CDN(jsdelivr) から取得します（写真は送信しません。取得するのは文字認識モデルのみ）。

### パーサーの動作確認

```powershell
npx esbuild scripts/test-extract.mjs --bundle --platform=node --format=esm --outfile=scripts/.test-bundle.mjs
node scripts/.test-bundle.mjs
```

## 無料で公開する（GitHub Pages）

1. このリポジトリ（vLLM-apps）を GitHub に push。
2. リポジトリの **Settings → Pages → Build and deployment → Source: GitHub Actions** を選択。
3. 同梱の [.github/workflows/deploy.yml](../.github/workflows/deploy.yml) が自動でビルド＆公開します。
4. 公開URL（例 `https://<ユーザー名>.github.io/vLLM-apps/`）を、LINE等でご家族に送るだけ。

> サブパス配信のため、ビルド時に `BASE_PATH=/vLLM-apps/` を指定しています（ワークフロー内で設定済み）。
> 独自ドメインやユーザーページ（`<user>.github.io`直下）に置く場合は `BASE_PATH=/` にしてください。

## 対応している検査項目（v1）

血球（WBC/RBC/Hb/Ht/PLT）、肝臓（AST/ALT/γ-GTP/ALP/T-Bil/LDH/TP/ALB）、
腎臓（BUN/Cr/eGFR/UA）、脂質（T-Cho/LDL/HDL/TG）、糖（血糖/HbA1c）、炎症（CRP）、電解質（Na/K/Cl）。

基準値は一般的な成人の目安です。**検査機関により異なります**。用紙に基準値が印字されていれば、そちらを優先採用します。
項目の追加は [src/knowledge/bloodTests.ts](src/knowledge/bloodTests.ts) に追記してください。

## 今後の拡張余地

- 画像（CT/MRIのスマホ写真）の一般的な所見コメント（候補のみ・非診断）
- 経時変化のグラフ（前回との比較）
- 結果の保存（端末内のみ）・PDFエクスポート

## プライバシー

- 既定エンジンでは、写真・数値は**端末内のみ**で処理し、サーバへ送信しません。
- Claude を選んだ場合のみ、画像が Anthropic API に送信されます（設定で明示的に選んだ人だけ）。
- APIキー・設定は端末の localStorage にのみ保存されます。
- 個人の検査結果・画像はリポジトリにコミットしないでください（`.gitignore` 済み）。
