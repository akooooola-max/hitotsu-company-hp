#!/usr/bin/env python3
"""朝の統制室で承認したものを公開する。

    python3 scripts/publish.py apps:ok note:ng mark:skip
    python3 scripts/publish.py --all-ok          # 全部承認したとき
    python3 scripts/publish.py apps:ok --dry-run # 何が動くかだけ見る

統制室の画面の「公開コマンドをコピー」を押すと、この形の1行が手に入る。
承認(ok)したものだけがファイルを移動し、差し戻し(ng)・見送り(skip)は下書きに残る。
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
QUEUE = ROOT / "control" / "queue.json"
OK, NG, SKIP = "ok", "ng", "skip"


def die(msg):
    print(msg, file=sys.stderr)
    sys.exit(1)


def git(*args):
    return subprocess.run(["git", *args], cwd=ROOT, check=True,
                          capture_output=True, text=True).stdout


def main():
    args = [a for a in sys.argv[1:]]
    dry = "--dry-run" in args
    all_ok = "--all-ok" in args
    pairs = [a for a in args if not a.startswith("--")]

    if not QUEUE.exists():
        die("control/queue.json がありません。先に夜間工場を回してください。")
    queue = json.loads(QUEUE.read_text(encoding="utf-8"))
    items = {i["id"]: i for i in queue["items"]}
    if not items:
        print("承認待ちはありません。")
        return

    decisions = {}
    if all_ok:
        decisions = {k: OK for k in items}
    for p in pairs:
        if ":" not in p:
            die(f"「{p}」の形が違います。 id:ok / id:ng / id:skip で指定してください。")
        jid, d = p.split(":", 1)
        if jid not in items:
            die(f"「{jid}」は今日の承認待ちにありません。（今日: {', '.join(items)}）")
        if d not in (OK, NG, SKIP):
            die(f"「{d}」は使えません。ok / ng / skip のどれかです。")
        decisions[jid] = d

    if not decisions:
        die("どれを公開するか指定してください。例: python3 scripts/publish.py apps:ok")

    # 動かす前に、全部のファイルがそろっているか確かめる
    missing = [f["from"] for jid, d in decisions.items() if d == OK
               for f in items[jid].get("files", []) if not (ROOT / f["from"]).exists()]
    if missing:
        die("下書きが見つかりません:\n  " + "\n  ".join(missing))

    published, held, manual, touched = [], [], [], []
    for jid, d in decisions.items():
        item = items[jid]
        if d != OK:
            held.append(f"{item['title']}（{'差し戻し' if d == NG else '見送り'}）")
            continue
        for f in item.get("files", []):
            src, dst = ROOT / f["from"], ROOT / f["to"]
            print(f"  {f['from']}  →  {f['to']}")
            touched.append(f["to"])
            if not dry:
                dst.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src, dst)
        published.append(item["title"])
        if item.get("manual"):
            manual.append(f"{item['title']}：{item['manual']}")

    if dry:
        print("\n--dry-run なので何も変えていません。")
        return

    # 公開したものを承認待ちから外す（差し戻しは残す＝もう一度見る）
    queue["items"] = [i for i in queue["items"] if decisions.get(i["id"]) != OK]
    QUEUE.write_text(json.dumps(queue, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    if published:
        # 公開したファイルと承認待ち一覧だけをコミットする。
        # 作業中の別の変更を巻き込まないため、-A は使わない。
        git("add", "control/queue.json", *touched)
        msg = "公開: " + " / ".join(published)
        body = "\n".join(f"- {t}" for t in published)
        git("commit", "-q", "-m", f"{msg}\n\n{body}\n\n承認: {queue['date']} 朝の統制室")
        print(f"\n公開しました（{len(published)} 件）。git push で反映されます。")
    if held:
        print("\n公開しなかったもの:\n  " + "\n  ".join(held))
    if manual:
        print("\n手で送るもの:\n  " + "\n  ".join(manual))


if __name__ == "__main__":
    main()
