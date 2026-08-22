# -*- coding: utf-8 -*-
# Vidéo pub des DERNIÈRES NOUVEAUTÉS, SANS voix ni musique (demande explicite
# de la gérante, 22/08/2026) : image + zoom dynamique + sous-titres uniquement.
# Même montage/rythme que pub_gratuite.py (recette CLAUDE.md), mais durées
# fixes (~2,2 s/segment) puisqu'il n'y a plus de voix off pour les caler.
import os, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg, imageio

OUT = "/tmp/claude-0/-home-user-Niro/376b8974-977b-5216-a92d-7f2497266b32/scratchpad"
FF = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 1080, 1920, 30
GOLD = (201, 162, 75); CREAM = (250, 246, 238); INK = (30, 26, 22); WHITE = (255, 255, 255)
SERIFB = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
SANS = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
SANSB = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
def F(p, s): return ImageFont.truetype(p, s)
B = "https://nivcreation.fr/produits/"

# (fichier, nom, sous-titre)
P = [
    ("veilleuse-prenom-1.jpg", "Veilleuse Arbre de Vie", "Personnalisée au prénom"),
    ("cartes-etapes-bebe-1.jpg", "Cartes Étapes Bébé", "Girafe, lot de 12"),
    ("cartes-etapes-animaux-2.jpg", "Cartes Étapes Animaux", "Ours, renard, faon"),
    ("photophore-fee-1.jpg", "Photophore Fée", "Bougie LED incluse"),
    ("support-telephone-photo.jpg", "Support Téléphone", "Votre photo gravée"),
    ("support-ajoure-1.jpg", "Support Ajouré", "Dentelle de bois"),
    ("porte-serviettes-1.jpg", "Porte-Serviettes Fleur", "Décor de table"),
    ("porte-serviettes-colombes-1.jpg", "Porte-Serviettes Colombes", "Décor de mariage"),
]
SEG_DUR = 2.2
INTRO_DUR, OUTRO_DUR = 1.9, 2.3

def dl(f):
    dst = f"{OUT}/src_{f.replace('/', '_')}"
    subprocess.run(["curl", "-s", "--max-time", "60", "-o", dst, B + f], check=True)
    return dst

def cover(im, w, h):
    iw, ih = im.size; s = max(w / iw, h / ih)
    im = im.resize((int(iw * s) + 1, int(ih * s) + 1), Image.LANCZOS); iw, ih = im.size
    return im.crop(((iw - w) // 2, (ih - h) // 2, (iw - w) // 2 + w, (ih - h) // 2 + h))

def wrap(d, t, f, mw):
    o = []; c = ""
    for w in t.split():
        tt = (c + " " + w).strip()
        if d.textlength(tt, font=f) <= mw: c = tt
        else: o.append(c); c = w
    if c: o.append(c)
    return o

def overlay(name, sub):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    band = Image.new("L", (1, H), 0); p = band.load()
    for y in range(H): p[0, y] = int(215 * max(0, (y - 1120) / (H - 1120)) ** 1.15)
    dark = Image.new("RGBA", (W, H), (15, 12, 9, 255)); dark.putalpha(band.resize((W, H)))
    im = Image.alpha_composite(im, dark); d = ImageDraw.Draw(im)
    d.text((60, H - 360), name, font=F(SERIFB, 74), fill=GOLD)
    y = H - 258
    for ln in wrap(d, sub, F(SANS, 44), W - 120): d.text((60, y), ln, font=F(SANS, 44), fill=WHITE); y += 54
    d.text((60, H - 90), "nivcreation.fr", font=F(SANSB, 34), fill=(235, 220, 180))
    return im

def card(big, small, big2=None):
    im = Image.new("RGB", (W, H), CREAM); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 14], fill=GOLD); d.rectangle([0, H - 14, W, H], fill=GOLD)
    fB = F(SERIFB, 100); wb = d.textlength(big, font=fB); d.text(((W - wb) // 2, H // 2 - 160), big, font=fB, fill=GOLD)
    fS = F(SANS, 50); ws = d.textlength(small, font=fS); d.text(((W - ws) // 2, H // 2 - 20), small, font=fS, fill=INK)
    if big2:
        f2 = F(SANSB, 44); w2 = d.textlength(big2, font=f2); d.text(((W - w2) // 2, H // 2 + 60), big2, font=f2, fill=(120, 100, 60))
    return im

# préparer segments : (kind, image, overlay_ou_None, duree)
segs = []
segs.append(("card", card("NiV CRÉATION", "Nos dernières créations").convert("RGB"), None, INTRO_DUR))
ZW, ZH = int(W * 1.18), int(H * 1.18)
for f, name, sub in P:
    src = dl(f); im = Image.open(src).convert("RGB"); zi = cover(im, ZW, ZH)
    ov = overlay(name, sub)
    segs.append(("prod", zi, ov, SEG_DUR))
segs.append(("card", card("nivcreation.fr", "Personnalisez le vôtre", "Gravé & fabriqué en France").convert("RGB"), None, OUTRO_DUR))

# rendu vidéo (silencieux : aucune piste audio)
wri = imageio.get_writer(f"{OUT}/nouveautes_silencieuse.mp4", fps=FPS, codec="libx264", quality=8,
    macro_block_size=1, ffmpeg_params=["-pix_fmt", "yuv420p"], ffmpeg_log_level="error")
cream = Image.new("RGB", (W, H), CREAM)
for kind, img, ov, dur in segs:
    nf = max(1, int(round(dur * FPS)))
    for fi in range(nf):
        prog = fi / max(1, nf - 1)
        if kind == "card":
            frame = img.convert("RGBA")
        else:
            z = 1.18 - 0.18 * prog
            cw, ch = int(W * z), int(H * z); x = (img.size[0] - cw) // 2; y = (img.size[1] - ch) // 2
            crop = img.crop((x, y, x + cw, y + ch)).resize((W, H), Image.LANCZOS).convert("RGBA")
            frame = Image.alpha_composite(crop, ov)
        frame = frame.convert("RGB")
        FA = int(0.16 * FPS); a = 1.0
        if fi < FA: a = fi / FA
        elif fi > nf - FA: a = max(0, (nf - fi) / FA)
        if a < 1.0: frame = Image.blend(cream, frame, a)
        wri.append_data(np.asarray(frame))
wri.close()

total = sum(s[3] for s in segs)
subprocess.run([FF, "-y", "-i", f"{OUT}/nouveautes_silencieuse.mp4",
    "-vf", "scale=720:1280", "-c:v", "libx264", "-profile:v", "main", "-pix_fmt", "yuv420p",
    "-crf", "26", "-preset", "medium", "-an", "-movflags", "+faststart",
    f"{OUT}/niv-pub-nouveautes-silencieuse.mp4"],
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
print("DUREE %.1fs" % total, "| taille", os.path.getsize(f"{OUT}/niv-pub-nouveautes-silencieuse.mp4"))
