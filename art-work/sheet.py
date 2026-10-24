#!/usr/bin/env python3
"""コンタクトシート: python3 art-work/sheet.py <名前> <ID...>
img/enemy/<ID>.webp か img/bg/<ID>.webp を探して、暗い背景に並べた art-work/sheets/<名前>.png を作る。"""
import os, sys
from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
name, ids = sys.argv[1], sys.argv[2:]
tiles = []
for i in ids:
    for sub in ("enemy", "bg", "ui"):
        p = os.path.join(ROOT, "img", sub, i + ".webp")
        if os.path.exists(p):
            tiles.append((i, Image.open(p).convert("RGBA")))
            break
if not tiles:
    sys.exit("画像がない")
cell = 360
cols = min(4, len(tiles))
rows = (len(tiles) + cols - 1) // cols
sheet = Image.new("RGBA", (cols * cell, rows * (cell + 28)), (40, 34, 70, 255))
d = ImageDraw.Draw(sheet)
for k, (i, im) in enumerate(tiles):
    s = min((cell - 20) / im.width, (cell - 20) / im.height)
    t = im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.LANCZOS)
    x = (k % cols) * cell + (cell - t.width) // 2
    y = (k // cols) * (cell + 28) + (cell - t.height) // 2
    # 市松で透明が分かるように
    bx, by = (k % cols) * cell, (k // cols) * (cell + 28)
    for yy in range(0, cell, 20):
        for xx in range(0, cell, 20):
            if (xx // 20 + yy // 20) % 2 == 0:
                d.rectangle([bx + xx, by + yy, bx + xx + 19, by + yy + 19], fill=(52, 46, 86, 255))
    sheet.paste(t, (x, y), t)
    d.text(((k % cols) * cell + 8, (k // cols) * (cell + 28) + cell + 6), i, fill=(255, 255, 255, 255))
os.makedirs(os.path.join(ROOT, "art-work", "sheets"), exist_ok=True)
out = os.path.join(ROOT, "art-work", "sheets", name + ".png")
sheet.convert("RGB").save(out)
print("ok", out)
