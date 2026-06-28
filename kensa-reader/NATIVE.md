# ネイティブアプリ化（Capacitor）

Web/PWA版は **プロトタイプ**。本命は **Capacitor によるハイブリッドアプリ**。
理由: iOS Safari の `navigator.share` は共有シートが描画に割り込み、共有後に WebView の
タッチが固まる不具合がある。**ネイティブ共有（@capacitor/share）は WebView ではなく
ネイティブ層の共有を使うため、この固まりを構造的に回避**できる。

- 既存の React コードをほぼそのまま流用（`webDir: dist`）。
- 共有処理は `src/guide/ai.ts` の `shareNative()`（ネイティブ時）／`shareImage()`（Web時）。
  `src/components/Handoff.tsx` が `isNativeApp()` で自動分岐。
- ネイティブ時は **画像＋質問文を一度に共有** → 共有後はアプリが応答したまま完了画面へ。

## 共通

```bash
cd kensa-reader
npm install
npm run build        # dist を生成
npx cap sync         # dist と plugins を各プラットフォームへ反映
```

## Android（Windowsでビルド可）

前提: **Android Studio**（JDK 17 + Android SDK 同梱）をインストール。

```bash
npm run android      # build → sync → Android Studio が開く
```

Android Studio で実機（USBデバッグ有効）またはエミュレータを選び ▶ Run。
- 確認: 写真を選ぶ → 種類 → 「写真と質問をまとめて送る」→ **Androidの共有シート** →
  ChatGPT/Gemini等を選択 → 画像＋質問文が渡る → 戻ってもアプリは固まらず完了画面。

## iOS（**macOS / Xcode が必須**）

WindowsだけではiPhone用にビルドできない。次のいずれか:

### A. Mac がある場合（推奨・無料）

**1) 準備（初回のみ）**
```bash
# Node 18+ が必要。CocoaPods を入れる
sudo gem install cocoapods           # もしくは: brew install cocoapods
```

**2) このリポジトリを Mac に取得**
```bash
git clone https://github.com/LISIT/kensa-reader.git
cd kensa-reader/kensa-reader         # ← アプリ本体（kensa-reader/kensa-reader）
npm install
npm run build
npx cap add ios                      # ios/ を生成（pod install が走る）
npx cap sync ios
npx cap open ios                     # Xcode が開く
```

**3) Xcode で署名（無料のApple IDでOK）**
- 左ペインで **App** を選択 → **Signing & Capabilities** タブ
- **Automatically manage signing** にチェック
- **Team** で自分の Apple ID を選択（無料でよい。初回は Xcode → Settings → Accounts で Apple ID を追加）
- **Bundle Identifier** が重複でエラーなら `jp.lisit.kensareader` を一意な値に変更（例: `jp.lisit.kensareader.ご自分の名前`）

**4) カメラ/写真の許可文を追加**（無いと撮影/選択でクラッシュ）
- `ios/App/App/Info.plist` に以下を追加（Xcode の Info タブで + でも可）:
  - `Privacy - Camera Usage Description` = `写真を撮るためにカメラを使用します`
  - `Privacy - Photo Library Usage Description` = `検査結果の写真を選ぶために使用します`

**5) iPhone を USB 接続して実行**
- 上部のデバイス選択で自分の iPhone を選ぶ → ▶ Run
- 初回、iPhone 側で「信頼されていないデベロッパ」と出たら:
  **設定 → 一般 → VPNとデバイス管理 → 自分のApple ID → 信頼**
- 以後アプリアイコンから起動できる（無料署名は **7日で失効** → 失効したら再度 ▶ Run）

**6) 検証**（最小アプリの確認）
- 写真を撮る/選ぶ → 種類 → 「📤 写真と質問をまとめて送る」
- **ネイティブの共有シート**（iOSの標準シート）が出る → ChatGPT/Claude/Gemini を選ぶ
- **画像＋質問文**が渡る → 送信 → アプリに戻っても **固まらず**、完了画面が出る ← ここが今回の本丸

> コード変更後に再ビルドするときは `npm run build && npx cap sync ios` → Xcode で ▶ Run。

### B. Mac が無い（Windowsのみ）場合
クラウドの macOS ビルドを使う:
- **Codemagic**（無料枠あり）または **GitHub Actions の macOS ランナー** で iOS をビルド。
- 実機(iPhone)へ入れるには **Apple Developer Program（年 $99）** + TestFlight 配信が必要
  （Appleの制約。無料のローカル7日署名は Mac 実機接続が前提）。

## 検証ポイント（最小アプリの確認事項）
1. ネイティブ共有シートが出るか（iOS: UIActivityViewController / Android: Intent chooser）
2. ChatGPT/Claude/Gemini に **画像＋質問文** が渡るか
3. 共有後にアプリへ戻って **固まらない**か（完了画面が出る・操作できる）
4. 「写真を撮る/選ぶ」がネイティブのカメラ/フォトピッカーで動くか
