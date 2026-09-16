# 夜間工場（nightly factory）

寝ているあいだに、AI社員が7本の仕事をします。
どれも **下書きで止まります**。公開されるのは、朝の統制室でオーナーが承認したものだけです。

```
  夜 02:00   scripts/nightly.sh
             └ jobs/01〜07 を順に実行（claude -p）
               └ 成果物を control/drafts/<日付>/<ジョブID>/ に書く
               └ 各ジョブが queue-item.json を書く
             └ 全部まとめて control/queue.json を作る
             └ NIGHTLY_DEPLOY=1 なら wrangler deploy（ゲートの内側に配信）

  朝 07:30   https://hitotsu-company.com/control/
             └ 承認待ち一覧が出る。中身を見て 承認 / 差し戻し / 見送り
             └ 「公開コマンドをコピー」を押す

  その後     scripts/publish.py apps:ok note:ng ...
             └ 承認したものだけを公開先へ移してコミット
```

## なぜ下書きで止めるのか

誤配信を1回やると、取り返しがつかないからです。
夜間工場は「作るところまで」。公開の判断は、必ず人間が朝に1回だけ行います。

## 下書きを git に入れてはいけない

**このリポジトリは public です。** コミットした時点で、承認前の原稿も顧問先のレポートも
GitHub から誰でも読めます。合言葉ゲート（`src/gate.js`）が守るのは Web からの入口だけで、
git は別の出口です。

なので `control/drafts/` `control/queue.json` `control/clients/*`（README と雛形を除く）は
`.gitignore` に入れてあります。下書きは手元のディスクに置き、`wrangler deploy` で
ゲートの内側にだけ配信します。朝スマホから見られるのはこの配信のおかげです。

顧問先の情報を扱うなら、この線は動かさないでください。
リポジトリを private にする方針が決まっていますが、private になっても
この線は残します（顧問先のレポートは、そもそも git に置かない）。

## すでにある「週次の自動下書き」との関係

`docs/automation/weekly-drafts.md` に、日曜夜に設計図1本と投稿案7日分を作る手順があります。
こちらは **毎晩7本** を回す仕組みで、対象が広い代わりに承認の場が統制室（`/control/`）になります。
当面は両方を並べて動かし、どちらに寄せるかは実際に回してから決めてください。
重複して困るのは note まわり（`jobs/02-note.md` と週次の設計図）だけです。

## ジョブ一覧

| ID | 中身 | 担当 | 公開先 |
|---|---|---|---|
| `apps` | 道具箱の新作1本 | ai-company / builder | `apps/` に配置（自動） |
| `note` | note下書き1本（通信の今週分） | book-company / note | noteに貼る（手動） |
| `book` | Kindle 3冊目の1章 | book-company / writer | 原稿置き場（手動） |
| `komon` | 顧問先の週次レポート | claude-company / analyst | 顧問先に送る（手動） |
| `mark` | 電脳リサーチ 仕入れ候補10件 | MARK / seller・profit | 仕入れ判断（手動） |
| `houkago` | 大人の放課後 次回案内 | fukushi-company / planner | LINE・部室アプリ（手動） |
| `brief` | 統制室ブリーフ | ai-company / leader | 朝のLINE（自動・任意） |

## 設定

```sh
# 1. 統制室の合言葉（Cloudflare側。1回だけ）
npx wrangler secret put CONTROL_KEY
npx wrangler deploy

# 2. 夜間工場を回す（cron から）
#    NIGHTLY_DEPLOY=1 を付けると、下書きを作ったあと deploy まで行います。
#    作業中の変更（control/ の外）が残っているときは deploy を見送ります。
0 2 * * *  cd /path/to/hitotsu-company-hp && NIGHTLY_DEPLOY=1 ./scripts/nightly.sh >> /tmp/nightly.log 2>&1

# 3. 任意：朝のブリーフを送る先
export CONTROL_WEBHOOK="https://..."
```

初回は `DRY_RUN=1 ./scripts/nightly.sh` で段取りだけ見て、
次に `./scripts/nightly.sh apps` で1ジョブだけ試してください。

## ジョブの足し方

`jobs/08-xxx.md` を作るだけです。先頭のメタ情報（`id` / `title` / `team` / `accent`）と、
本文に指示を書きます。`scripts/nightly.sh` は `jobs/*.md` を番号順に全部実行します。

## ジョブが守る約束

1. 成果物は `control/drafts/<日付>/<ジョブID>/` の中にだけ書く。既存ファイルを直接書き換えない。
   `nightly.sh` はジョブごとに `control/` の外が変わっていないか確かめ、変わっていたらそこで止まります。
2. 最後に `queue-item.json` を書く。書かないジョブは「今日はやることなし」とみなされる。
3. 公開先を書き換える必要があるもの（道具箱のindexなど）は、書き換え後のファイルも下書きとして出す。
   公開は `publish.py` がファイルを移すだけで済むようにする。

`queue-item.json` の `from` は `control/drafts/<日付>/` の中、`to` はリポジトリの中しか書けません。
`preview` は `drafts/...` の相対パスだけです。外を指すものは承認待ちに並ぶ前に落とされます
（`build_queue.py` と `publish.py` の両方で確かめています）。
