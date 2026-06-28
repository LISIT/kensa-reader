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

### A. Mac がある場合
```bash
# Mac 上で
npm install
npx cap add ios        # ios/ を生成（CocoaPods が必要: sudo gem install cocoapods）
npm run ios            # build → sync → Xcode が開く
```
Xcode で署名（無料のApple IDでも7日間の開発用署名が可能）→ iPhoneをUSB接続して ▶ Run。

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
