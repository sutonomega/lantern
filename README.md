# Lantern

Lantern は、短い言葉と静かな反応に集中する匿名 SNS です。

フォロワー、公開された人気指標、拡散競争を前提にせず、投稿を「いいね」ではなく「灯す」ことで反応します。

## 現在の状態

MVP 開発中です。最初の到達点は次の 4 つです。

- username/password 認証
- 匿名投稿
- 新着フィード
- 投稿を灯す

## ローカル開発

```bash
npm install
npm run db:init
npm run dev
```

開発サーバーは通常 `http://localhost:3000` で起動します。

## 利用できるコマンド

```bash
npm run dev      # 開発サーバーを起動
npm run db:init  # SQLite DB を初期化
npm run build    # 本番ビルド
npm run start    # ビルド済みアプリを起動
npm run lint     # ESLint
npm run check    # TypeScript 型チェック
npm run test     # DB/API 前提の基本テスト
```

## 環境変数

| 変数 | 用途 | 既定値 |
| --- | --- | --- |
| `DATABASE_PATH` | SQLite データベースの保存先 | `./lantern.sqlite` |

## デプロイ

現時点の推奨デプロイ先は Node.js が動く単一インスタンス環境です。SQLite とメモリレート制限を使っているため、複数インスタンスで動かす場合は DB ファイルの永続化とレート制限ストアの共有化が必要です。

本番で最低限確認すること:

- `DATABASE_PATH` が永続ディスクを指している
- `npm run db:init` をデプロイ時または初回起動前に実行する
- HTTPS 配下で動かし、session cookie の `secure` が有効になる
- `npm run check && npm run lint && npm run test && npm run build` が通る

## ドキュメント

- [コンセプト](docs/concept.md)
- [アーキテクチャ](docs/architecture.md)
- [ロードマップ](docs/roadmap.md)

## GitHub Issues

MVP 完遂に必要な作業は Issue に分割しています。

- #1 Next.js の土台とローカル開発環境
- #2 username/password 認証
- #3 SQLite 永続化
- #4 匿名投稿と新着フィード
- #5 投稿を灯すインタラクション
- #6 安全性・バリデーション・モデレーション
- #7 自動チェックとデプロイ手順
- #8 MVP 後の発見・便利機能
