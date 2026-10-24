#!/usr/bin/env python3
"""生成PNGをゲーム用 webp に整える。
  enemy: python3 art-work/process.py enemy <PNG> <ID>  -> img/enemy/<ID>.webp
         アルファでトリム → 長辺 640px に収める → 4px の透明余白。足もと(下端中央)がそのまま基準点になる。
  bg:    python3 art-work/process.py bg <PNG> <ID>     -> img/bg/<ID>.webp   (横 1920px)
  ui:    python3 art-work/process.py ui <PNG> <ID>     -> img/ui/<ID>.webp   (アルファでトリム・長辺 900px)
元PNGは art-work/raw/<ID>.png にもコピーする。"""
import os, shutil, sys
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
kind, src, iid = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(os.path.join(ROOT, "art-work", "raw"), exist_ok=True)
raw = os.path.join(ROOT, "art-work", "raw", iid + ".png")
if os.path.abspath(src) != raw:
    shutil.copyfile(src, raw)

im = Image.open(src).convert("RGBA")


def trim(img, limit):
    a = img.split()[3]
    bbox = a.point(lambda v: 255 if v > 10 else 0).getbbox()
    if not bbox:
        sys.exit("透過アルファが見つからない（背景が不透明?）: " + src)
    if bbox == (0, 0, img.width, img.height):
        corners = [a.getpixel((0, 0)), a.getpixel((img.width - 1, 0)),
                   a.getpixel((0, img.height - 1)), a.getpixel((img.width - 1, img.height - 1))]
        if min(corners) > 200:
            sys.exit("四すみが不透明です（背景が透明になっていない）: " + src)
    img = img.crop(bbox)
    s = min(1.0, limit / max(img.size))
    if s < 1.0:
        img = img.resize((max(1, round(img.width * s)), max(1, round(img.height * s))), Image.LANCZOS)
    pad = 4
    out = Image.new("RGBA", (img.width + pad * 2, img.height + pad * 2), (0, 0, 0, 0))
    out.paste(img, (pad, pad), img)
    return out


if kind == "enemy":
    out = trim(im, 640)
    dst = os.path.join(ROOT, "img", "enemy", iid + ".webp")
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    out.save(dst, "WEBP", quality=86, alpha_quality=100, method=6)
elif kind == "ui":
    out = trim(im, 900)
    dst = os.path.join(ROOT, "img", "ui", iid + ".webp")
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    out.save(dst, "WEBP", quality=86, alpha_quality=100, method=6)
elif kind == "bg":
    im = im.convert("RGB")
    w = 1920
    h = round(im.height * w / im.width)
    im = im.resize((w, h), Image.LANCZOS)
    dst = os.path.join(ROOT, "img", "bg", iid + ".webp")
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im.save(dst, "WEBP", quality=80, method=6)
else:
    sys.exit("kind は enemy / bg / ui")
print("ok", kind, iid, os.path.getsize(dst) // 1024, "KB", Image.open(dst).size)
