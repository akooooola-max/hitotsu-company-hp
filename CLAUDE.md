# Hitotsu Company HP

屋号 Hitotsu Company のコーポレートサイト。Cloudflare Workers（静的アセット＋統制室ゲート）で
`hitotsu-company.com` に配信しています。ビルドはありません。HTMLを書けばそれが本番です。

## 構成

| パス | 中身 |
|---|---|
| `index.html` / `style.css` | 会社トップ（会社概要・6事業・組織図・54名・AI社員室） |
| `consul/` | AIコンサルのメニューと料金（単発＋月額プラン） |
| `kenshu/` | AI研修 |
| `houkago/` | 大人の放課後（社会人の部活コミュニティ） |
| `hp/` | ホームページ制作プラン |
| `apps/` | 道具箱。毎朝1本増える無料ツール群 |
| `card.html` `books.html` `tokusho.html` `tool-order.html` | 名刺・著書・特商法・福祉ツール注文 |
| `control/` | **法人統制室**（合言葉ゲートの内側。承認待ちと下書き置き場） |
| `jobs/` `scripts/` | 夜間工場（毎晩7本）。→ `jobs/README.md` |
| `docs/blueprints/` | AI社員の設計図。AI社員室（月額）の週1配信の在庫 |
| `docs/automation/` `docs/posts/` | 週次の自動下書きと投稿案 |
| `src/gate.js` | 統制室の合言葉ゲート（Worker） |
| `docs/` | 事業計画・提案書 |

`.assetsignore` に入っているもの（`src/` `jobs/` `scripts/` `docs/` など）は配信されません。

## 書き方のきまり

- **1ファイル完結**。ビルドツール・npmパッケージ・フレームワークを持ち込まない。
  CSSとJSはそのページの `<style>` `<script>` に直接書く（`index.html` だけ `style.css` を共有）。
- **外部通信をしない**。道具箱のツールは、入力をブラウザの外に出さない。
  これは売り文句ではなく約束です（「お客様の実データはお預かりしません」）。
- ページごとに配色が違う。既存ページを直すときは、そのページの `:root` の変数に従う。
  会社トップ系は `--accent:#D97757` のダーク、consul は紺＋オレンジ、kenshu はクリーム＋えんじ。
- 日本語の折り返しは `word-break:auto-phrase` と `<span class="nb">` で整える（既存の書き方に合わせる）。
- スマホ幅で読めること。横スクロールを出さない。
- `prefers-reduced-motion` を尊重する。

## 文章のきまり

- 専門用語を使わない。使うなら、その場で言い換える。
- 「〜できます」より「〜しました」。実際にやったことだけ書く。
- 煽らない。断定を避けない。長くしない。
- 価格は必ず税込で、どのページでも同じ数字にする。変えるときは
  `consul/` `kenshu/` `index.html` `houkago/` `tokusho.html` を揃えて直す。
  いまの月額は AI社員室 2,980円／顧問プラン 19,800円／AI部署プラン 59,800円〜。

## さわるときに気をつけること

- **`control/` は社外に出せない中身です。** 承認前の原稿・顧問先のレポート・仕入れ候補が入ります。
  ここへのリンクを公開ページに置かないでください。
- **`control/drafts/` `control/queue.json` `control/clients/*` は `.gitignore` に入っています。**
  外さないでください。承認前の原稿と顧問先のレポートは、リポジトリの private / public に
  関わらず git に入れない方針です（合言葉ゲートが守るのは Web の入口だけで、git は別の出口）。
  下書きは `wrangler deploy` でゲートの内側にだけ配信します。
- **`docs/blueprints/` は会員特典（AI社員室 2,980円/月 の週1配信）の原稿です。**
  サイトからは配信されませんが、リポジトリが public のあいだは GitHub から誰でも読めます。
  **private にする方針が決まっています**（→ `docs/blueprints/README.md` の冒頭）。
  切り替わったら、3か所の注意書きを消してください。
- **`apps/` の道具は夜間工場が毎朝足します。** 手で直すときは
  `apps/index.html` と `apps/box-9f4a7c2e/index.html` の両方（件数と日付も）を揃えること。
- **決済リンク**は `consul/index.html` の `PAY` にまとまっています。
  URLが空のプランは、申し込みボタンが出ません（`komon` と `busho` が未設定）。
- 価格や解約条件を変えたら、`tokusho.html`（特定商取引法に基づく表記）も必ず直すこと。

## 動かす

```sh
python3 -m http.server 8000     # 見た目の確認はこれで足りる
npx wrangler dev                # ゲートまで含めて確認するとき
npx wrangler deploy             # 本番へ
npx wrangler secret put CONTROL_KEY   # 統制室の合言葉（1回だけ）
```
