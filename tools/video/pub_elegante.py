# -*- coding: utf-8 -*-
# Vidéos produit ÉLÉGANTES pour Instagram — SANS musique, sans voix.
# Style : lent, raffiné, couleurs marque, fondus doux, léger zoom, serif.
import os, subprocess, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT = "/tmp/claude-0/-home-user-Niro/376b8974-977b-5216-a92d-7f2497266b32/scratchpad"
VID = f"{OUT}/elegant"; os.makedirs(VID, exist_ok=True)
import imageio_ffmpeg
FF = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 1080, 1920, 30
GOLD = (201, 162, 75); GOLD_D = (169, 137, 53); CREAM = (250, 246, 239)
INK = (36, 26, 12); INK_SOFT = (122, 111, 92); SOFT = (226, 198, 126); WHITE = (255, 255, 255)
SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
SERIF_R = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"
SCRIPT = "/root/.fonts/GreatVibes.ttf"
SITE = "https://nivcreation.fr"
def F(p, s): return ImageFont.truetype(p, s)

def dl(path, i):
    dst = f"{VID}/_src_{i}.jpg"
    subprocess.run(["curl", "-s", "--max-time", "60", "-o", dst, SITE + path if path.startswith("/") else path])
    return dst if os.path.exists(dst) and os.path.getsize(dst) > 2000 else None

def cover(im, w, h):
    iw, ih = im.size; s = max(w / iw, h / ih)
    im = im.resize((int(iw * s) + 1, int(ih * s) + 1), Image.LANCZOS); iw, ih = im.size
    return im.crop(((iw - w) // 2, (ih - h) // 2, (iw - w) // 2 + w, (ih - h) // 2 + h))

def ctext(d, cx, y, txt, font, fill, ls=0):
    if ls:
        tot = sum(d.textlength(c, font=font) + ls for c in txt) - ls
        x = cx - tot / 2
        for c in txt:
            d.text((x, y), c, font=font, fill=fill); x += d.textlength(c, font=font) + ls
        return
    w = d.textlength(txt, font=font); d.text((cx - w / 2, y), txt, font=font, fill=fill)

def bottom_grad(im):
    g = Image.new("L", (1, H), 0); px = g.load()
    for y in range(H):
        px[0, y] = int(210 * max(0, (y - 1080) / (H - 1080)) ** 1.15)
    dark = Image.new("RGBA", (W, H), (12, 8, 3, 255)); dark.putalpha(g.resize((W, H)))
    im.alpha_composite(dark)

def ease(t): return t * t * (3 - 2 * t)  # smoothstep

def photo_frame(src, k, title, tagline):
    # k in [0,1] : progression du zoom lent (Ken Burns doux)
    base = cover(Image.open(src).convert("RGB"), int(W * 1.10), int(H * 1.10))
    z = 1.0 + 0.055 * k
    cw, ch = int(W / z), int(H / z)
    bw, bh = base.size
    ox = int((bw - cw) * (0.5 + 0.04 * math.sin(k * 1.2)))
    oy = int((bh - ch) * (0.5 - 0.03 * k))
    ox = max(0, min(bw - cw, ox)); oy = max(0, min(bh - ch, oy))
    im = base.crop((ox, oy, ox + cw, oy + ch)).resize((W, H), Image.LANCZOS).convert("RGBA")
    bottom_grad(im)
    d = ImageDraw.Draw(im)
    # cadre fin doré (élégance)
    d.rectangle([26, 26, W - 26, H - 26], outline=(SOFT[0], SOFT[1], SOFT[2], 150), width=2)
    # eyebrow + trait + titre + tagline (bas)
    yb = 1360
    ctext(d, W // 2, yb, "NOUVEAUTÉ", F(SERIF_R, 30), (SOFT[0], SOFT[1], SOFT[2], 235), ls=10)
    d.line([(W // 2 - 46, yb + 52), (W // 2 + 46, yb + 52)], fill=(SOFT[0], SOFT[1], SOFT[2], 220), width=2)
    for i, line in enumerate(title):
        ctext(d, W // 2, yb + 78 + i * 78, line, F(SERIF, 66), (255, 255, 255, 255))
    ctext(d, W // 2, yb + 96 + len(title) * 78, tagline, F(SERIF_R, 34), (238, 230, 214, 235))
    ctext(d, W // 2, 1780, "·  Gravé en France  ·", F(SERIF_R, 30), (SOFT[0], SOFT[1], SOFT[2], 230), ls=4)
    return im.convert("RGB")

def card(kind):
    im = Image.new("RGB", (W, H), CREAM); d = ImageDraw.Draw(im)
    d.rectangle([30, 30, W - 30, H - 30], outline=GOLD, width=2)
    d.rectangle([44, 44, W - 44, H - 44], outline=(GOLD_D[0], GOLD_D[1], GOLD_D[2]), width=1)
    if kind == "intro":
        ctext(d, W // 2, 760, "NiV", F(SERIF, 200), GOLD_D)
        ctext(d, W // 2, 1000, "CRÉATION", F(SERIF_R, 62), INK, ls=18)
        d.line([(W // 2 - 120, 1110), (W // 2 + 120, 1110)], fill=GOLD, width=2)
        ctext(d, W // 2, 1150, "Atelier de personnalisation", F(SERIF_R, 34), INK_SOFT, ls=3)
    else:
        ctext(d, W // 2, 720, "Fait à la main", F(SERIF_R, 40), INK_SOFT, ls=2)
        ctext(d, W // 2, 800, "en France", F(SERIF_R, 40), INK_SOFT, ls=2)
        d.line([(W // 2 - 120, 900), (W // 2 + 120, 900)], fill=GOLD, width=2)
        ctext(d, W // 2, 960, "nivcreation.fr", F(SERIF, 72), GOLD_D, ls=2)
        ctext(d, W // 2, 1080, "Chaque pièce gravée avec soin", F(SERIF_R, 34), INK_SOFT)
    return im

def fade(a, b, t):
    return Image.blend(a, b, ease(t))

def make(slug, photos, title, tagline):
    srcs = [dl(p, f"{slug}{i}") for i, p in enumerate(photos)]
    srcs = [s for s in srcs if s]
    if not srcs: return None
    frames = []
    intro = card("intro"); outro = card("outro")
    SEG = int(FPS * 4.0)      # 4 s par photo
    XF = int(FPS * 0.7)       # fondu 0.7 s
    CARD = int(FPS * 2.2)
    # intro (fade in depuis crème)
    for f in range(CARD):
        t = f / CARD
        a = min(1, t * 3); b = min(1, (1 - t) * 3)
        im = intro.copy()
        if a < 1: im = fade(Image.new("RGB", (W, H), CREAM), intro, a)
        frames.append(np.array(im))
    prev_last = intro
    for si, s in enumerate(srcs):
        seg = [photo_frame(s, f / SEG, title, tagline) for f in range(SEG)]
        # crossfade depuis l'image précédente
        for f in range(XF):
            frames.append(np.array(fade(prev_last, seg[f], f / XF)))
        for f in range(XF, SEG):
            frames.append(np.array(seg[f]))
        prev_last = seg[-1]
    # outro
    for f in range(XF):
        frames.append(np.array(fade(prev_last, outro, f / XF)))
    for f in range(CARD):
        t = f / CARD
        im = outro if t < 0.8 else fade(outro, Image.new("RGB", (W, H), CREAM), (t - 0.8) / 0.2)
        frames.append(np.array(im))
    raw = f"{VID}/{slug}_raw.mp4"
    import imageio
    imageio.mimsave(raw, frames, fps=FPS, quality=8, macro_block_size=8)
    out = f"{VID}/nivcreation_{slug}.mp4"
    subprocess.run([FF, "-y", "-i", raw, "-vf", "scale=720:1280", "-c:v", "libx264",
                    "-crf", "25", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    os.remove(raw)
    print(f"OK {out}  {os.path.getsize(out)//1024} Ko")
    return out

if __name__ == "__main__":
    PRODUCTS = {
        "carafe": (["/produits/carafe_gravee.jpg", "/produits/carafe_ambiance.jpg", "/produits/carafe_whiskey_1892.jpg"],
                   ["Carafe à whisky", "gravée"], "Gravée à votre nom, votre date"),
        "verre-vin": (["/produits/verre_vin_geniet.jpg", "/produits/verre_vin_ambiance.jpg"],
                      ["Verre à vin", "personnalisé"], "Un prénom, une date, un souvenir"),
        "plaque": (["/produits/collier_plaque_a_graver_argente_et_noir.jpg", "/produits/collier_plaque_a_graver_argente.jpg", "/produits/collier_plaque_a_graver_dore.jpg"],
                   ["Collier plaque", "acier à graver"], "Le bijou qui porte vos mots"),
    }
    import sys
    keys = sys.argv[1:] or list(PRODUCTS)
    for k in keys:
        p = PRODUCTS[k]; make(k, p[0], p[1], p[2])
