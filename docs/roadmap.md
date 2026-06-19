# Lantern ロードマップ

## P0: MVP 完遂

MVP は「登録して、匿名で投稿して、新着を読み、投稿を灯せる」状態を完成とします。

1. [#1](https://github.com/sutonomega/lantern/issues/1) Next.js の土台とローカル開発環境を整える
2. [#3](https://github.com/sutonomega/lantern/issues/3) users/posts/lights の SQLite 永続化を実装する
3. [#2](https://github.com/sutonomega/lantern/issues/2) username/password 認証を実装する
4. [#4](https://github.com/sutonomega/lantern/issues/4) 匿名投稿と新着フィードを実装する
5. [#5](https://github.com/sutonomega/lantern/issues/5) 投稿を灯すインタラクションを実装する

## P1: 公開運用前に必要

1. [#6](https://github.com/sutonomega/lantern/issues/6) 安全性・バリデーション・モデレーションの最低限を整える
2. [#7](https://github.com/sutonomega/lantern/issues/7) 自動チェックとデプロイ手順を整える

どちらも初期対応済み。実運用前に監査ログ、管理画面、共有レート制限ストア、デプロイ先の永続ディスク設定を追加で確認します。

## P2: MVP 後

1. [#8](https://github.com/sutonomega/lantern/issues/8) MVP 後の発見・便利機能を整理する
2. [#9](https://github.com/sutonomega/lantern/issues/9) 投稿検索を実装する
3. [#10](https://github.com/sutonomega/lantern/issues/10) 静かな発見フィードを設計・実装する
4. [#11](https://github.com/sutonomega/lantern/issues/11) 通知の方針を決めて実装する
5. [#12](https://github.com/sutonomega/lantern/issues/12) 自分の投稿編集を実装する
6. [#13](https://github.com/sutonomega/lantern/issues/13) 自分の投稿削除を実装する

#9、#11、#12、#13 は初期実装済み。#10 は API 実装済みですが、画面上の導線は保留します。

## P1: UI レイアウト改善

MVP 機能完了後は、スマホでの見やすさと Lantern らしい雰囲気を優先して整えます。

1. [#15](https://github.com/sutonomega/lantern/issues/15) モバイル向けヘッダーとメニュー導線を整える
2. [#19](https://github.com/sutonomega/lantern/issues/19) お知らせと検索を別ページへ分離する
3. [#16](https://github.com/sutonomega/lantern/issues/16) 夜とランタンの背景・カードデザインへ整える
4. [#17](https://github.com/sutonomega/lantern/issues/17) 灯すボタンをランタンモチーフにする
5. [#18](https://github.com/sutonomega/lantern/issues/18) UI 方針と画面構成をドキュメントに反映する

#15、#16、#17、#18、#19 は初期対応済みです。背景や灯すボタンは、今後のデザイン確認に合わせて細部を継続調整します。

## 通知方針

通知は投稿体験を邪魔しない控えめな確認欄として扱います。最初の通知対象は「自分の投稿が灯された」です。

- 通知欄はログイン中だけ表示する
- 通知は自分の投稿に対する灯りだけ作成する
- 自分で自分の投稿を灯しても通知しない
- 通知は未読数だけを表示し、公開ランキングや人気指標には使わない

## 静かな発見フィード方針

発見フィードは「人気順」「ランキング」「バズ」を作らない導線です。ただし、現時点の画面では新着相当の「新しいランタン」だけを表示し、発見フィード導線は保留します。

- 非表示にした投稿は出さない
- 投稿者名は出さない
- light 数を競争的な順位として使わない
- 導線を復活させる場合は、新着との違いが自然に伝わる名前と説明にする

## 優先度判断

- P0 は MVP の体験が成立しないもの
- P1 は公開運用や継続開発に必要なもの
- P2 は MVP 後に検討するもの
