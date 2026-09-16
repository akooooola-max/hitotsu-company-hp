#!/usr/bin/env bash
# 夜間工場。jobs/*.md を順に実行し、成果物を下書きとして control/drafts/<日付>/ に残す。
# 公開はしない。公開は朝の承認のあと scripts/publish.py が行う。
#
# 下書きは git に入れない。このリポジトリは public なので、コミットすれば
# 承認前の原稿も顧問先のレポートも外から読めてしまう。下書きは手元のディスクに置き、
# wrangler deploy で合言葉ゲート（src/gate.js）の内側にだけ配信する。
#
#   cron 例: 0 2 * * * cd /path/to/hitotsu-company-hp && ./scripts/nightly.sh >> /tmp/nightly.log 2>&1
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

CLAUDE_BIN="${CLAUDE_BIN:-claude}"
DATE="${NIGHTLY_DATE:-$(date +%F)}"
DRAFTS="control/drafts/$DATE"
ONLY="${1:-}"          # 例: ./scripts/nightly.sh apps   → そのジョブだけ流す
DRY="${DRY_RUN:-}"     # DRY_RUN=1 で claude を呼ばずに段取りだけ確認する

log() { printf '[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }

if ! command -v "$CLAUDE_BIN" >/dev/null 2>&1 && [ -z "$DRY" ]; then
  log "claude コマンドが見つかりません（CLAUDE_BIN で指定できます）"; exit 1
fi

mkdir -p "$DRAFTS"
log "夜間工場を開始します（$DATE）"

failed=0
for job in jobs/[0-9]*.md; do
  id="$(sed -n 's/^id: *//p' "$job" | head -1)"
  title="$(sed -n 's/^title: *//p' "$job" | head -1)"
  [ -n "$id" ] || { log "スキップ: $job に id がありません"; continue; }
  if [ -n "$ONLY" ] && [ "$ONLY" != "$id" ]; then continue; fi

  mkdir -p "$DRAFTS/$id"
  log "── $id : $title"

  prompt="$(cat <<EOF
$(cat "$job")

---
今日の日付は $DATE です。<日付> と書かれている箇所はすべて $DATE に読み替えてください。
成果物は $DRAFTS/$id/ の中にだけ書いてください。リポジトリの既存ファイルは絶対に書き換えないこと。
公開はしません。オーナーが朝に承認したものだけを、別の手順で公開します。
やることがない日は、$DRAFTS/$id/queue-item.json を作らずに終了してください。
EOF
)"

  if [ -n "$DRY" ]; then
    log "  DRY_RUN のため実行しません（プロンプト $(printf '%s' "$prompt" | wc -c) 文字）"
    continue
  fi

  before="$(git status --porcelain -- . ':(exclude)control' | sha1sum)"

  if ! "$CLAUDE_BIN" -p "$prompt" --permission-mode acceptEdits >"$DRAFTS/$id/run.log" 2>&1; then
    log "  失敗しました（$DRAFTS/$id/run.log を見てください）"
    failed=$((failed+1))
    continue
  fi

  # ジョブは下書きの中だけを書く約束。約束の外に手が出ていたら、その場で止める。
  after="$(git status --porcelain -- . ':(exclude)control' | sha1sum)"
  if [ "$before" != "$after" ]; then
    log "  !! $id が control/ の外を書き換えました。中身を確かめてください:"
    git status --porcelain -- . ':(exclude)control' | sed 's/^/     /'
    log "  !! 続きを止めます。git diff で確認し、不要なら git checkout -- <file> で戻してください。"
    exit 1
  fi

  if [ -f "$DRAFTS/$id/queue-item.json" ]; then
    log "  下書きができました"
  else
    log "  今日はやることなし"
  fi
done

# 承認待ち一覧を作る
python3 scripts/build_queue.py "$DATE" || { log "queue.json の作成に失敗しました"; exit 1; }

count="$(python3 -c "import json,sys;print(len(json.load(open('control/queue.json'))['items']))" 2>/dev/null || echo 0)"
log "承認待ち $count 件"

# 下書きは git に入れない（.gitignore 済み）。
# 朝、スマホから統制室を開くには配信が要るので、必要なら deploy する。
if [ "${NIGHTLY_DEPLOY:-}" = "1" ]; then
  dirty="$(git status --porcelain -- . ':(exclude)control')"
  if [ -n "$dirty" ]; then
    log "作業中の変更があるので deploy しません（先にコミットするか戻してください）:"
    printf '%s\n' "$dirty" | sed 's/^/   /'
  elif npx wrangler deploy >"$DRAFTS/deploy.log" 2>&1; then
    log "deploy しました（統制室に承認待ちが出ます）"
  else
    log "deploy に失敗しました（$DRAFTS/deploy.log を見てください）"
  fi
fi

# 朝のブリーフを送る（任意）
brief="$DRAFTS/brief/brief.txt"
if [ -n "${CONTROL_WEBHOOK:-}" ] && [ -f "$brief" ]; then
  if curl -fsS -X POST -H 'content-type: application/json' \
       --data "$(python3 -c 'import json,sys;print(json.dumps({"text":open(sys.argv[1]).read()}))' "$brief")" \
       "$CONTROL_WEBHOOK" >/dev/null; then
    log "ブリーフを送信しました"
  else
    log "ブリーフの送信に失敗しました（下書きは残っています）"
  fi
fi

log "終了（失敗 $failed 件）"
exit 0
