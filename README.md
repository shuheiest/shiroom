# Shiroom - PDF無害化システム

PDFファイルの脅威検出と無害化を行うセキュリティシステム。危険なコンテンツを自動検出し、安全な形で無害化処理を実行します。
※※Claude Codeを使用してvibe codingで実装しており、正しく動作しない可能性があります。
## 🎯 主な機能

- **PDF脅威検出**: JavaScript、疑わしいURL、危険なファイル名パターンを検出
- **自動無害化**: 危険要素を除去し、安全なPDFとして再生成
- **ファイル隔離**: 危険ファイルの自動隔離とログ記録
- **Webインターフェース**: ドラッグ&ドロップ対応のアップロード画面
- **詳細レポート**: 脅威詳細と処理結果の分かりやすい表示

## 🚀 クイックスタート

### 前提条件
- Node.js 18+

### セットアップ & 起動
```bash
# 1. 依存関係のインストール
npm install

# 2. テスト用PDFファイルの作成
node scripts/create-test-pdfs.js
node scripts/create-malicious-test-pdf.js

# 3. サーバー起動
npm run dev

# 4. ブラウザでアクセス
# http://localhost:8080
```

## 📖 使い方

### Webインターフェース
1. ブラウザで `http://localhost:8080` にアクセス
2. PDFファイルをドラッグ&ドロップまたはクリックで選択
3. 「無害化を開始」ボタンをクリック
4. 結果を確認:
   - ✅ **安全**: 予防的無害化処理を実行
   - ⚠️ **脅威検出**: 無害化処理を実行してアップロード完了
   - 🚫 **処理失敗**: ファイルを隔離

### テストファイル

#### 安全なテスト用PDF (`test-pdfs/`)
- `safe-document.pdf` - 通常の安全なPDF
- `form-document.pdf` - フォームフィールド付き
- `link-document.pdf` - 外部リンク付き
- `metadata-document.pdf` - メタデータ付き
- `annotation-document.pdf` - 注釈付き
- `large-document.pdf` - 大容量ファイル

#### 脅威検出テスト用PDF (`test-pdfs/`)
- `suspicious-test.pdf` - JavaScript関連パターン検出テスト
- `malware-test.pdf` - ファイル名パターン検出テスト
- `virus-multi-threat.pdf` - 複合脅威検出テスト

### API エンドポイント

#### ヘルスチェック
```bash
GET /api/health
```

#### ファイルアップロード
```bash
POST /api/upload
Content-Type: multipart/form-data

# curlでの例
curl -X POST -F "file=@test.pdf" http://localhost:8080/api/upload
```

## 🛡️ セキュリティ機能

### 脅威検出パターン
- **JavaScript実行コード**: `/JavaScript(`, `/JS(`, `eval(`, `document.write` など
- **危険なPDF機能**: `/OpenAction`, `/Launch`, `/SubmitForm` など
- **疑わしいURL**: 短縮URL、不審なドメイン
- **危険なファイル名**: `malware`, `virus`, `trojan` などのキーワード

### 無害化処理
- **メタデータクリア**: 作成者、タイトル、キーワードなどを除去
- **危険要素除去**: JavaScript、フォーム、注釈を除去
- **安全なページ保持**: テキストと画像コンテンツのみ保持

### ファイル管理
- `uploads/` - 無害化済みファイル（`sanitized_` プレフィックス）
- `quarantine/` - 隔離された危険ファイル
- `sanitized/` - 処理ログファイル

## 📁 プロジェクト構造

```
├── src/
│   ├── test-server.js     # メインサーバー（Express + 無害化機能）
│   ├── index.ts          # TypeScript版サーバー（未使用）
│   ├── types/            # TypeScript型定義
│   └── utils/            # ユーティリティ関数
├── scripts/
│   ├── create-test-pdfs.js          # 安全なテスト用PDF作成
│   └── create-malicious-test-pdf.js # 脅威検出テスト用PDF作成
├── test-pdfs/            # テスト用PDFファイル
├── uploads/              # 無害化済みファイル
├── quarantine/           # 隔離ファイル
├── sanitized/            # 処理ログ
├── simple-upload.html    # アップロード画面
└── prisma/               # データベース設定（将来拡張用）
```

## 🔧 開発

### 利用可能なコマンド
```bash
# 開発サーバー起動
npm run dev

# テスト実行
npm test

# リント実行
npm run lint

# 型チェック
npm run type-check

# ビルド
npm run build
```

### ログ確認
```bash
# サーバーログはコンソールに表示
# 追加でファイルログ:
# - quarantine/*.log (隔離ログ)
# - sanitized/*.log (無害化ログ)
```

## 🛠️ トラブルシューティング

### ポート競合
```bash
# ポート8080が使用中の場合
lsof -ti:8080 | xargs kill
```

### ファイル権限エラー
```bash
# アップロードディレクトリの権限確認
chmod 755 uploads/ quarantine/ sanitized/
```

### PDFライブラリエラー
```bash
# 依存関係を再インストール
rm -rf node_modules package-lock.json
npm install
```

## 📊 処理結果の例

### 安全ファイル
```json
{
  "success": true,
  "message": "ファイルは安全でした。予防的無害化処理が完了しました。",
  "data": {
    "originalName": "safe-document.pdf",
    "sanitizedFileName": "sanitized_2024-01-01T00-00-00-000Z_safe-document.pdf",
    "originalSize": 15234,
    "sanitizedSize": 12890,
    "threatsDetected": 0
  }
}
```

### 脅威検出ファイル
```json
{
  "success": true,
  "sanitized": true,
  "message": "危険なコンテンツが検出されましたが、無害化処理が完了しました。",
  "threats": [
    {
      "type": "suspicious_content",
      "pattern": "/\\/JavaScript\\s*\\(/i",
      "severity": "high"
    }
  ],
  "data": {
    "originalName": "suspicious-test.pdf",
    "sanitizedFileName": "sanitized_2024-01-01T00-00-00-000Z_suspicious-test.pdf",
    "threatsDetected": 1
  }
}
```
