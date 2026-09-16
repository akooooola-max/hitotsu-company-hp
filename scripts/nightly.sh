#!/usr/bin/env bash
# 夜間工場。jobs/*.md を順に実行し、成果物を下書きとして control/drafts/<日付>/ に残す。
# 公開はしない。公開は朝の承認のあと scripts/publish.py が行う。
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

  if ! "$CLAUDE_BIN" -p "$prompt" --permission-mode acceptEdits >"$DRAFTS/$id/run.log" 2>&1; then
    log "  失敗しました（$DRAFTS/$id/run.log を見てください）"
    failed=$((failed+1))
    continue
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

# 下書きをコミット（統制室ゲートの内側なので、これで公開されることはない）
if [ -n "$(git status --porcelain control/ 2>/dev/null)" ]; then
  git add control/
  git commit -q -m "control: 夜間工場の下書き（$DATE・$count件）" && log "コミットしました"
  if [ "${NIGHTLY_PUSH:-}" = "1" ]; then
    git push -q origin HEAD && log "push しました"
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
