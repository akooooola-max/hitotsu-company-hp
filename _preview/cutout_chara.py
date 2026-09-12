#!/usr/bin/env python3
"""キャラクター画像（3Dチビ・円背景）を透過切り抜きして、サイト用に軽量化する。

  python3 cutout_chara.py                # キャラクター/ フォルダの全画像を処理
  python3 cutout_chara.py <画像パス> ...   # 指定した画像だけ処理

出力先: _preview/assets/
  chara-<元ファイル名>.webp / .png（最大640px・透過）
最初の1枚（または --main 指定）は chara-main.webp / .png にもコピーする。
"""
import sys, io
from pathlib import Path
from PIL import Image
from rembg import remove, new_session

SRC_DIR = Path.home() / "Hitotsu Company" / "資料・制作物" / "画像素材" / "キャラクター"
OUT_DIR = Path(__file__).parent / "assets"
MAX = 640

def process(path: Path, session):
    im = Image.open(path).convert("RGBA")
    out = remove(im, session=session, alpha_matting=True,
                 alpha_matting_foreground_threshold=240,
                 alpha_matting_background_threshold=10,
                 alpha_matting_erode_size=8)
    out = out.crop(out.getbbox())
    out.thumbnail((MAX, MAX), Image.LANCZOS)
    stem = "chara-" + path.stem.replace(" ", "_")
    out.save(OUT_DIR / f"{stem}.webp", "WEBP", quality=86, method=6)
    out.save(OUT_DIR / f"{stem}.png", optimize=True)
    print(f"{path.name} → {stem}.webp {out.size} {(OUT_DIR / (stem + '.webp')).stat().st_size // 1024}KB")
    return stem

def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    main_idx = 0
    if "--main" in sys.argv:
        main_idx = int(sys.argv[sys.argv.index("--main") + 1])
    files = [Path(a) for a in args] if args else sorted(
        p for p in SRC_DIR.iterdir() if p.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp"))
    if not files:
        print("画像が見つかりません:", SRC_DIR); return
    OUT_DIR.mkdir(exist_ok=True)
    session = new_session("isnet-anime")  # イラスト・キャラ向けモデル
    stems = [process(f, session) for f in files]
    m = stems[main_idx]
    for ext in ("webp", "png"):
        (OUT_DIR / f"chara-main.{ext}").write_bytes((OUT_DIR / f"{m}.{ext}").read_bytes())
    print("chara-main に採用:", m)

if __name__ == "__main__":
    main()
