#!/usr/bin/env python3
"""色ちがい を つくる（新しい え は かかない）。
  python3 art-work/variants.py            → img/enemy/e21〜e40.webp と img/bg/bg_s6〜bg_s10.webp
  python3 art-work/variants.py e27 bg_s9   → えらんだ もの だけ
もと の え（e01〜e20・bg_s1〜bg_s5）の いろ を かえて つくる。りんかくせん（こい むらさき）は そのまま のこす。"""
import os, sys
import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# id: (もと, やりかた, パラメータ)
#   shift    : いろあい を まわす（deg）。s=あざやかさ の ばいりつ, v=あかるさ の ばいりつ
#   colorize : ぜんぶ を ひとつ の いろ に そめる（hue=deg, s=あざやかさ, v=あかるさ）。all=1 なら しろい ところ も そめる
#   tint     : いろ を まぜる（hue, amt=まぜる わりあい, v=あかるさ）。はいけい よう
SPEC = {
    "e21": ("e01", "colorize", dict(hue=46, s=.88, v=1.08)),                 # きんいろ すらいむ
    "e22": ("e02", "colorize", dict(hue=262, s=.55, v=.92, gamma=1.55, all=1)),          # やみ ねずみ
    "e23": ("e03", "shift", dict(deg=-82, s=1.15, v=1.0, rng=(45, 160))),                    # あか ごぶりん
    "e24": ("e04", "colorize", dict(hue=14, s=.88, v=1.05, gamma=1.15, all=1)),          # ほのお の おおかみ おう
    "e25": ("e05", "colorize", dict(hue=270, s=.50, v=.92, gamma=1.7, all=1)),          # くろ がいこつ
    "e26": ("e06", "colorize", dict(hue=44, s=.72, v=1.05, all=1)),          # おうごん ごーれむ
    "e27": ("e07", "shift", dict(deg=180, s=1.0, v=1.0)),                    # あおび とかげ
    "e28": ("e08", "colorize", dict(hue=252, s=.48, v=.95, gamma=1.45, all=1)),                    # やみ とうぞく の かしら
    "e29": ("e09", "shift", dict(deg=95, s=1.1, v=1.05)),                    # ほのお ぐも
    "e30": ("e10", "shift", dict(deg=75, s=1.15, v=.86)),                    # やみ の まじょ
    "e31": ("e11", "colorize", dict(hue=44, s=.70, v=1.05, all=1)),          # おうごん きし
    "e32": ("e12", "colorize", dict(hue=276, s=.72, v=.95, gamma=1.8, all=1)),          # くろ いかずち どり
    "e33": ("e13", "shift", dict(deg=-145, s=1.05, v=1.0)),                  # みどり しかばね づかい
    "e34": ("e14", "shift", dict(deg=180, s=.95, v=1.08)),                   # ひょうが きょじん
    "e35": ("e15", "shift", dict(deg=-135, s=1.05, v=1.0)),                  # あおおに
    "e36": ("e16", "colorize", dict(hue=200, s=.22, v=1.18, all=1)),         # はくじゃ ぬし
    "e37": ("e17", "shift", dict(deg=95, s=1.45, v=.95, rng=(215, 335))),                    # くれない てんし
    "e38": ("e18", "shift", dict(deg=150, s=1.05, v=1.0)),                   # ほのお りゅう きへい
    "e39": ("e19", "colorize", dict(hue=268, s=.58, v=.95, gamma=1.65, all=1)),          # こくりゅう ばるが
    "e40": ("e20", "shift", dict(deg=88, s=1.2, v=.95, rng=(225, 340))),                    # むげん の まおう ぜろ
    "bg_s6": ("bg_s1", "tint", dict(hue=224, amt=.80, v=.50, s=.75)),        # よる の はらっぱ（ほたる）
    "bg_s7": ("bg_s2", "tint", dict(hue=232, amt=.62, v=.58, s=.85)),        # たそがれ の こうや
    "bg_s8": ("bg_s3", "shift", dict(deg=150, s=1.0, v=.9)),                 # くれない の ゆきやま
    "bg_s9": ("bg_s4", "shift", dict(deg=185, s=1.0, v=.95)),                # あおい ほのお の かざん
    "bg_s10": ("bg_s5", "shift", dict(deg=80, s=1.1, v=.92)),                # あかい つき の しろ
}


def rgb_to_hsv(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx = rgb.max(-1); mn = rgb.min(-1); df = mx - mn
    h = np.zeros_like(mx)
    m = df > 1e-6
    rm = m & (mx == r); gm = m & (mx == g) & ~rm; bm = m & ~rm & ~gm
    h[rm] = ((g - b)[rm] / df[rm]) % 6
    h[gm] = ((b - r)[gm] / df[gm]) + 2
    h[bm] = ((r - g)[bm] / df[bm]) + 4
    h = h / 6.0
    s = np.where(mx > 1e-6, df / np.maximum(mx, 1e-6), 0)
    return h, s, mx


def hsv_to_rgb(h, s, v):
    i = np.floor(h * 6).astype(int) % 6
    f = h * 6 - np.floor(h * 6)
    p = v * (1 - s); q = v * (1 - f * s); t = v * (1 - (1 - f) * s)
    out = np.zeros(h.shape + (3,))
    for k, (a, b, c) in enumerate([(v, t, p), (q, v, p), (p, v, t), (p, q, v), (t, p, v), (v, p, q)]):
        mk = i == k
        out[..., 0][mk] = a[mk]; out[..., 1][mk] = b[mk]; out[..., 2][mk] = c[mk]
    return out


def recolor(arr, mode, P):
    rgb = arr[..., :3].astype(float) / 255.0
    h, s, v = rgb_to_hsv(rgb)
    alpha = arr[..., 3] if arr.shape[-1] == 4 else np.full(h.shape, 255)
    # りんかくせん（くらい ところ）は のこす。くらい ほど かえない。
    keep = np.clip((v - .14) / .16, 0, 1)
    if mode == "shift":
        w = keep * np.clip((s - .08) / .12, 0, 1)
        if "rng" in P:   # この いろあい の はんい だけ まわす（さかい は 20ど で なめらかに）
            lo, hi = P["rng"][0] / 360.0, P["rng"][1] / 360.0
            hh = h if lo <= hi else (h - lo) % 1.0
            if lo <= hi:
                mem = np.clip(np.minimum(hh - lo, hi - hh) / (20 / 360.0) + .5, 0, 1)
            else:
                span = (hi - lo) % 1.0
                mem = np.clip(np.minimum(hh, span - hh) / (20 / 360.0) + .5, 0, 1)
            w = w * mem
        nh = (h + P["deg"] / 360.0) % 1.0
        h2 = np.where(w > 0, nh, h)
        s2 = np.clip(s * (1 + (P.get("s", 1) - 1) * w), 0, 1)
        v2 = np.clip(v * (1 + (P.get("v", 1) - 1) * keep), 0, 1)
        # いろあい は ぴたっと かえる（まぜると にごる）が、わずかに さかい を なめらかに
        h = np.where(w > .5, h2, h)
        s, v = s2, v2
    elif mode == "colorize":
        satmask = np.clip((s - .08) / .12, 0, 1)
        w = keep * (1.0 if P.get("all") else satmask)
        h = np.where(w > .02, P["hue"] / 360.0, h)
        target_s = P["s"] * (0.55 + 0.45 * np.clip(s * 1.6, 0, 1))
        s = s * (1 - w) + target_s * w
        v2 = np.power(v, P.get("gamma", 1.0))
        v = np.clip((v * (1 - w) + v2 * w) * (1 + (P.get("v", 1) - 1) * w), 0, 1)
    elif mode == "tint":
        th = P["hue"] / 360.0
        tint = hsv_to_rgb(np.full(h.shape, th), np.full(h.shape, .55), np.ones(h.shape))
        base = hsv_to_rgb(h, np.clip(s * P.get("s", 1), 0, 1), v)
        mixed = base * (1 - P["amt"]) + base * tint * P["amt"] * 1.6
        mixed = np.clip(mixed * P.get("v", 1), 0, 1)
        out = (mixed * 255).astype(np.uint8)
        return np.dstack([out, alpha.astype(np.uint8)]) if arr.shape[-1] == 4 else out
    out = (hsv_to_rgb(h, s, v) * 255).astype(np.uint8)
    return np.dstack([out, alpha.astype(np.uint8)]) if arr.shape[-1] == 4 else out


def make(vid):
    base, mode, P = SPEC[vid]
    if vid.startswith("bg_"):
        src = os.path.join(ROOT, "img", "bg", base + ".webp"); dst = os.path.join(ROOT, "img", "bg", vid + ".webp")
        im = Image.open(src).convert("RGB")
        out = Image.fromarray(recolor(np.asarray(im), mode, P), "RGB")
        out.save(dst, "WEBP", quality=80, method=6)
    else:
        src = os.path.join(ROOT, "img", "enemy", base + ".webp"); dst = os.path.join(ROOT, "img", "enemy", vid + ".webp")
        im = Image.open(src).convert("RGBA")
        out = Image.fromarray(recolor(np.asarray(im), mode, P), "RGBA")
        out.save(dst, "WEBP", quality=86, alpha_quality=100, method=6)
    print("ok", vid, "←", base, os.path.getsize(dst) // 1024, "KB")


ids = sys.argv[1:] or list(SPEC)
for i in ids:
    make(i)
