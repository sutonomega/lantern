# Lantern アーキテクチャ

## 技術構成

- フロントエンド: Next.js App Router, React, TypeScript
- バックエンド: Next.js Route Handlers
- データベース: SQLite
- 認証: username/password + サーバー側セッション
- スタイリング: CSS Modules ではなくグローバル CSS から開始し、必要になった時点で分割する

## 初期ディレクトリ方針

```text
app/
  layout.tsx
  page.tsx
  globals.css
docs/
  architecture.md
  concept.md
  roadmap.md
```

API、DB、認証を追加する段階で次の構成を追加します。

```text
app/api/
lib/
  auth/
  db/
  posts/
```

## 主要データ

スキーマ定義は `lib/db/schema.sql` に置き、`npm run db:init` でローカル DB を初期化します。

### users

- `id`
- `username`
- `password_hash`
- `created_at`

### posts

- `id`
- `user_id`
- `body`
- `created_at`
- `deleted_at`

公開フィードでは `user_id` や `username` を表示しません。

### lights

- `id`
- `user_id`
- `post_id`
- `created_at`

`user_id` と `post_id` の組み合わせは一意にし、同じユーザーが同じ投稿を重複して灯せないようにします。

### sessions

- `id`
- `user_id`
- `expires_at`
- `created_at`

セッション ID は httpOnly Cookie に保存し、DB には期限付きで保持します。

### hidden_posts

- `id`
- `user_id`
- `post_id`
- `created_at`

ユーザーが自分の新着から外した投稿を記録します。

### reports

- `id`
- `user_id`
- `post_id`
- `reason`
- `created_at`

同じユーザーが同じ投稿を重複通報しないようにします。

### notifications

- `id`
- `user_id`
- `actor_user_id`
- `post_id`
- `type`
- `read_at`
- `created_at`

最初の通知対象は「自分の投稿が灯された」です。自分で自分の投稿を灯した場合は通知しません。

## DB ヘルパー

`lib/db/client.ts` は SQLite 接続を作り、`lib/db/repositories.ts` は API から使うための最小 query 関数を提供します。

- `createUser`
- `findUserByUsername`
- `createPost`
- `listNewestPosts`
- `createLight`
- `countLights`

## 認証 API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

## 投稿 API

- `GET /api/posts`
- `POST /api/posts`
- `PATCH /api/posts/:postId`
- `DELETE /api/posts/:postId`
- `GET /api/posts/discover`
- `GET /api/posts/search`
- `POST /api/posts/:postId/lights`
- `POST /api/posts/:postId/hide`
- `POST /api/posts/:postId/report`
- `GET /api/notifications`
- `PATCH /api/notifications`

## API 方針

- 入力検証はクライアントだけでなくサーバー側でも行う
- 認証が必要な操作はサーバー側で必ずセッションを確認する
- 投稿編集はサーバー側で投稿者本人か確認する
- 投稿削除は `deleted_at` を使った論理削除とし、サーバー側で投稿者本人か確認する
- エラーメッセージは簡潔にし、認証情報の推測につながる詳細を返しすぎない
- 認証、投稿、灯す、非表示、通報にはメモリ上の簡易レート制限をかける

## セキュリティ方針

- パスワードは平文保存しない
- セッション Cookie は httpOnly を前提にする
- 投稿、ログイン、灯す操作にはレート制限を検討する
- 匿名サービスとして、通報または非表示の導線を MVP 後すぐに追加できる設計にする

## 自動チェック

GitHub Actions で次を実行します。

- `npm run check`
- `npm run lint`
- `npm run test`
- `npm run build`

現状の `npm run test` は SQLite スキーマの基本挙動を `node:test` で確認します。
