# CLAUDE.md

## プロジェクト概要
TypeScriptベースのファイル無害化サーバー。現在はPDFの無害化に特化し、潜在的に悪意のあるコンテンツを除去しつつ、文書の構造と可読性を保持します。

## 技術スタック
- TypeScript - メイン言語
- Node.js - 実行環境
- Prisma ORM - PostgreSQLでのデータベース操作
- Frourio - 型安全なAPIフレームワーク（自動型生成）
- PostgreSQL - ファイルメタデータ、処理ログ、監査証跡の管理
- Docker & Docker Compose - セキュリティ分離と一貫した環境のためのコンテナ化

## プロジェクト構造
```
src/
├── api/           # Frourio APIルートとコントローラー
├── models/        # Prismaモデルとデータベーススキーマ
├── services/      # コア無害化ロジック
├── utils/         # ヘルパー関数とユーティリティ
├── types/         # TypeScript型定義
└── middleware/    # 認証、バリデーション、ログ

docker/
├── Dockerfile     # アプリケーションコンテナ定義
├── docker-compose.yml # マルチサービス連携
└── nginx.conf     # リバースプロキシ設定（本番環境）

prisma/
├── schema.prisma  # データベーススキーマ定義
└── migrations/    # データベースマイグレーションファイル

uploads/           # 一時ファイル保存（Dockerボリューム）
sanitized/         # 処理済みファイル保存（Dockerボリューム）
```

## 共通コマンド

### Docker開発環境
- 開発環境開始: `docker-compose up -d`
- サービス停止: `docker-compose down`
- コンテナ再構築: `docker-compose up --build`
- ログ確認: `docker-compose logs -f app`
- コンテナ内でコマンド実行: `docker-compose exec app bash`

### データベース管理
- データベース設定: `docker-compose exec app npx prisma migrate dev`
- Prismaクライアント生成: `docker-compose exec app npx prisma generate`
- データベース管理画面: `docker-compose exec app npx prisma studio`
- データベースリセット: `docker-compose exec app npx prisma migrate reset`

### ローカル開発（コンテナ内）
- 依存関係インストール: `npm install`
- ビルド: `npm run build`
- 開発サーバー: `npm run dev`
- テスト: `npm test`
- リント: `npm run lint`
- 型チェック: `npm run type-check`

## 開発ワークフロー
1. Docker環境開始: `docker-compose up -d`
2. `prisma/schema.prisma`でPrismaスキーマを更新
3. `docker-compose exec app npx prisma migrate dev`で変更を適用
4. FrourioがAPI定義から自動的に型を生成
5. `services/`で無害化ロジックを実装
6. `api/`ディレクトリにAPIエンドポイントを追加
7. 分離されたコンテナ環境で変更をテスト
8. `docker-compose logs -f app`でログを確認

## コーディング規約
- 明示的な戻り値型でstrictなTypeScriptを使用
- `let`より`const`を優先
- ESLint設定に従う
- データベース操作にはPrisma生成型を使用
- APIにはFrourioの型安全性を活用
- ファイル処理に包括的なエラーハンドリングを追加
- 監査のため全ての無害化処理をログに記録

## セキュリティ考慮事項
- **コンテナ分離**: 全てのファイル処理を分離されたDockerコンテナで実行
- **リソース制限**: DockerコンテナでCPU/メモリを制限しリソース枯渇を防止
- **ネットワーク分離**: サービス間は定義されたDockerネットワークでのみ通信
- **ボリュームセキュリティ**: 適切な権限設定でセキュアなDockerボリュームを使用
- アップロードファイルの処理前バリデーション
- ファイルアップロードのレート制限実装
- ファイル名とメタデータの無害化
- セキュアなディレクトリでの処理済みファイル保存
- タイムスタンプとユーザーコンテキストでの全ファイル操作ログ
- 悪意のあるファイル検出の適切なハンドリング

## 環境変数
必要な環境変数（docker-compose.ymlで設定）:
- `DATABASE_URL` - PostgreSQL接続文字列
- `UPLOAD_DIR` - 一時ファイル保存ディレクトリ（Dockerボリューム）
- `SANITIZED_DIR` - 処理済みファイルディレクトリ（Dockerボリューム）
- `MAX_FILE_SIZE` - 最大許可ファイルサイズ（バイト）
- `LOG_LEVEL` - アプリケーションログレベル
- `POSTGRES_DB` - データベース名
- `POSTGRES_USER` - データベースユーザー
- `POSTGRES_PASSWORD` - データベースパスワード

## Docker設定
主要なDocker設定の考慮事項:
- 最適化されたイメージサイズのためのマルチステージビルド
- セキュリティのためのコンテナ内非rootユーザー
- サービス監視のためのヘルスチェック
- 永続データのための適切なボリュームマウント
- サービス間のネットワーク分離
- DoS攻撃防止のためのリソース制限（メモリ、CPU）

## ファイル処理パイプライン
1. ファイルアップロードバリデーション（サイズ、タイプ、構造）
2. 一意識別子での一時保存
3. PDF解析と脅威検出
4. 無害化処理（スクリプト、フォーム、アノテーション除去）
5. フォーマット保持した出力生成
6. データベースログとファイルアーカイブ
7. 一時ファイルのクリーンアップ