#!/usr/bin/env python3
"""下書きの queue-item.json を集めて control/queue.json を作る。

夜間工場（scripts/nightly.sh）の最後に呼ばれる。手で流し直してもよい:
    python3 scripts/build_queue.py 2026-09-16
"""
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JOBS = ROOT / "jobs"
FRONT = re.compile(r"^---\n(.*?)\n---", re.S)


def job_meta():
    """jobs/*.md の先頭メタ情報を、ファイル名の番号順に読む。"""
    out = []
    for path in sorted(JOBS.glob("[0-9]*.md")):
        m = FRONT.match(path.read_text(encoding="utf-8"))
        if not m:
            continue
        meta = {}
        for line in m.group(1).splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip().strip('"')
        if meta.get("id"):
            meta["n"] = path.name[:2]
            out.append(meta)
    return out


def main():
    date = sys.argv[1] if len(sys.argv) > 1 else datetime.now().strftime("%Y-%m-%d")
    drafts = ROOT / "control" / "drafts" / date

    items = []
    for meta in job_meta():
        item_file = drafts / meta["id"] / "queue-item.json"
        if not item_file.exists():
            continue  # そのジョブは今日やることがなかった
        try:
            item = json.loads(item_file.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            print(f"  {meta['id']}: queue-item.json が壊れています（{e}）", file=sys.stderr)
            continue
        item.setdefault("id", meta["id"])
        item["n"] = meta["n"]
        item["title"] = meta.get("title", item["id"])
        item["team"] = meta.get("team", "")
        item["accent"] = meta.get("accent", "#D97757")
        item.setdefault("summary", "")
        item.setdefault("files", [])
        item.setdefault("manual", None)
        # 公開先のファイルが本当にあるか確かめる（承認したのに動かせない、を防ぐ）
        for f in item["files"]:
            if not (ROOT / f["from"]).exists():
                print(f"  {item['id']}: 下書き {f['from']} が見つかりません", file=sys.stderr)
        items.append(item)

    queue = {
        "date": date,
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "items": items,
    }
    out = ROOT / "control" / "queue.json"
    out.write_text(json.dumps(queue, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"control/queue.json を作りました（{len(items)} 件）")


if __name__ == "__main__":
    main()
