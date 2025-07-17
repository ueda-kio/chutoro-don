# Neonデータベースセットアップ手順

## 1. Neonプロジェクトの作成
1. https://neon.tech にアクセス
2. 「Sign Up」でアカウント作成（GitHubアカウント推奨）
3. 「Create Project」をクリック
4. 設定:
   - Project name: `chutoro-don`
   - Database name: `chutoro-don-db`
   - Region: `Asia Pacific (Tokyo)` または `Asia Pacific (Singapore)`
   - PostgreSQL version: 15 (デフォルト)

## 2. 接続情報の取得
1. プロジェクト作成後、「Dashboard」に移動
2. 「Settings」→「Connection String」をクリック
3. 「Connection string」をコピー

## 3. 環境変数の設定
`.env.local` ファイルの `POSTGRES_URL` を更新:

```bash
# 例（実際の値に置き換える）
POSTGRES_URL="postgresql://username:password@ep-example-123456.ap-southeast-1.aws.neon.tech/chutoro-don-db?sslmode=require"
```

## 4. データベースのセットアップ

```bash
# Prismaクライアントの生成
pnpm prisma generate

# データベースのプッシュ（開発環境）
pnpm prisma db push

# データベースの状態確認
pnpm prisma studio
```

## 5. 本番APIの有効化

`.env.local` でモックAPIを無効にして本番APIを有効化:

```bash
# 簡易モックAPI設定を無効化
NEXT_PUBLIC_ENABLE_MOCK_API=false
```

## 6. 動作確認

```bash
# 開発サーバーの起動
pnpm dev

# ランキングページで確認
# http://localhost:3000/ranking

# チャレンジモードでスコア登録テスト
# http://localhost:3000/challenge
```

## 7. トラブルシューティング

### 接続エラーの場合
```bash
# 接続テスト
pnpm prisma db pull
```

### スキーマエラーの場合
```bash
# スキーマのリセット
pnpm prisma db push --force-reset
```

### 権限エラーの場合
- Neonダッシュボードでデータベース設定を確認
- IP制限が設定されていないか確認

## 8. Neonの特徴

### 無料プラン制限
- **データベースサイズ**: 0.5GB
- **コンピュート時間**: 月100時間
- **接続数**: 同時100接続

### ブランチング機能
```bash
# 本番環境用のブランチ作成
# Neonダッシュボードで「Create Branch」

# 環境別の接続文字列使用
# .env.local (開発環境)
POSTGRES_URL="postgresql://...main branch..."

# .env.production (本番環境)  
POSTGRES_URL="postgresql://...production branch..."
```

### 自動スケーリング
- アクセス量に応じて自動的にスケール
- 非アクティブ時は自動的にスリープ
- 初回アクセス時のコールドスタート（数秒）