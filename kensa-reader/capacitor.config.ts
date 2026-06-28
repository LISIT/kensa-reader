import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'jp.lisit.kensareader',
  appName: 'やさしい検査結果リーダー',
  // Vite のビルド出力をネイティブWebViewに同梱する
  webDir: 'dist',
  ios: {
    contentInset: 'always',
  },
}

export default config
