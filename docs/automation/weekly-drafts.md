# 週次 自動下書き 手順書（AI社員が日曜夜に実行する）

目的: オーナーが寝ている間に「今週の設計図1本」と「7日分の投稿案」を下書きし、
月曜朝にスマホで確認・承認できる状態にする。

## 実行するAI社員
- 設計図: book-company / note（記事化）＋ writer
- 投稿案: insta-company / writer

## 手順
1. `git fetch origin main && git checkout -B claude/weekly-drafts origin/main`
2. `docs/blueprints/` を見て、`status: published` / `reviewed` を除いた **次の未着手メンバー** を1人選ぶ
   （順番は `docs/blueprints/README.md` のテンプレートと既存ファイルの採番に従う。
   候補は `index.html` の 04 メンバー一覧にある54名。既に設計図があるメンバーは選ばない）。
3. `docs/blueprints/README.md` のテンプレート通りに `NN-<division>-<name>.md` を `status: draft` で作成する。
4. `apps/index.html` の最新ツール1件を確認し、`docs/posts/README.md` の型で
   今週7日分の投稿案 `docs/posts/YYYY-MM-DD.md` を作る（社長の行動欄は `（ここに今日の行動）` の空欄でよい）。
5. `git add docs && git commit -m "drafts: 設計図 NN と投稿案7本（自動下書き）"`
6. `git push -u origin claude/weekly-drafts`（既にある場合は上書きしてよい。main には push しない）。
7. 完了したら、作った設計図のタイトルと投稿案の日付範囲を1〜3行で報告する。

## やらないこと
- 公開サイト（HTML）を変更しない。docs/ 以外を触らない。
- main ブランチに push しない。
- 顧客名・実データを書かない。

## 稼働状況
- Claude Code の Routine「週次 AI社員 設計図＋投稿案 下書き」として登録済み（2026-09-08）。
- 実行: 毎週月曜 05:00 JST（UTC 日曜 20:00）。新しいセッションが立ち上がり、この手順書どおりに動く。
- 成果物: ブランチ `claude/weekly-drafts` に push。終了時にスマホへプッシュ通知。
- 止めたい・変えたいとき: claude.ai/code の Routines 一覧から停止・編集できる。
