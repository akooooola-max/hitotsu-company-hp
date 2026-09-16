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
PREVIEW_OK = re.compile(r"^drafts/[A-Za-z0-9._/-]+$")


def safe_under(base: Path, rel: str) -> bool:
    """rel が base の中に収まるか。絶対パスや .. を弾く。"""
    try:
        p = (base / rel).resolve()
    except (OSError, ValueError):
        return False
    base = base.resolve()
    return p != base and base in p.parents


def safe_preview(value):
    """統制室の画面がリンクにする値。drafts/ 配下の相対パス以外は捨てる。

    javascript: のようなURLをそのまま href に入れないため、形を決め打ちで確かめる。
    """
    if isinstance(value, str) and ".." not in value and PREVIEW_OK.match(value):
        return value
    return None


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

        # ジョブが書いたパスは信じない。おかしなものが1つでもあれば、その件ごと落とす。
        # （publish.py でも同じ確認をするが、承認待ちに並べる前に落としておく）
        bad = None
        for f in item["files"]:
            frm, to = f.get("from"), f.get("to")
            if not (isinstance(frm, str) and isinstance(to, str)):
                bad = f"from / to が文字列ではありません: {f!r}"
            elif not frm.startswith(f"control/drafts/{date}/"):
                bad = f"下書きの場所が違います: {frm}"
            elif not safe_under(ROOT / "control" / "drafts", frm[len("control/drafts/"):]):
                bad = f"下書きがフォルダの外を指しています: {frm}"
            elif not safe_under(ROOT, to) or to.startswith("-"):
                bad = f"公開先が使えません: {to}"
            elif not (ROOT / frm).exists():
                bad = f"下書き {frm} が見つかりません"
            if bad:
                break
        if bad:
            print(f"  {item['id']}: {bad} → この件は承認待ちに出しません", file=sys.stderr)
            continue

        item["preview"] = safe_preview(item.get("preview"))
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
