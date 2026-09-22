# -*- coding: utf-8 -*-
# Vidéo VERRES / CARAFE / BIJOUX, SANS voix ni musique (demande du gérant,
# 22/09/2026 : « sans musique et sans voix », « montre-moi d'autres produits ») : image + zoom dynamique + sous-titres uniquement.
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
# REGLE DU GERANT (22/09/2026) : UNIQUEMENT des photos ou la GRAVURE EST VISIBLE.
# Les 10 ci-dessous ont ete regardees une par une sur planche contact.
# ATTENTION, le nom de fichier MENT : "verre_vin_grave.jpg" et
# "verre_a_whisky_grave_ambiance.jpg" sont des verres VIERGES malgre leur nom.
# Toujours OUVRIR l image, jamais se fier au nom du fichier.
P = [
    ("carafe_gravee.jpg", "Carafe \u00e0 whisky grav\u00e9e", "Le motif, le pr\u00e9nom, l\u2019ann\u00e9e"),
    ("verre_a_whisky_exemple_face.jpg", "Verre \u00e0 whisky", "Votre photo grav\u00e9e dans le verre"),
    ("verre_a_whisky_exemple_fond.jpg", "Verre \u00e0 whisky", "Ou grav\u00e9e au fond du verre"),
    ("verre_whisky_papa_monde_moustache.jpg", "Verre \u00e0 whisky", "Votre texte, votre motif"),
    ("verre_vin_exemple_dale.jpg", "Verre \u00e0 vin grav\u00e9", "Monogramme et ann\u00e9e"),
    ("collier-coeur-grave-1.jpg", "Collier C\u0153ur", "Deux initiales, une date"),
    ("collier-3coeurs-1.jpg", "Collier 3 C\u0153urs entrelac\u00e9s", "Un pr\u00e9nom par c\u0153ur"),
    ("collier-coeur-plaques-1.jpg", "Collier C\u0153ur & 2 plaques", "Trois gravures sur une cha\u00eene"),
    ("collier-double-coeur-6.jpg", "Collier Double C\u0153ur", "Grav\u00e9 recto et verso"),
    ("bracelet-cordon-plaque-4.jpg", "Bracelet cordon \u00e0 plaque", "Pr\u00e9nom ou initiales"),
]
SEG_DUR = 2.2
INTRO_DUR, OUTRO_DUR = 1.9, 2.3

def dl(f):
    """Photo locale : le site est injoignable depuis certaines sessions (cf. CLAUDE.md).
    On lit public/produits/ ; on retombe sur le téléchargement si le fichier manque."""
    loc = os.path.join(os.path.dirname(__file__), "..", "..", "public", "produits", f)
    if os.path.exists(loc):
        return loc
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
    # Le titre s'ajuste à la largeur : 4 noms sur 9 débordaient à 74 px
    # (« Flûte à champagne gravée », « Collier 3 Cœurs entrelacés »…).
    ft = F(SERIFB, 74)
    for taille in range(74, 47, -2):
        ft = F(SERIFB, taille)
        if d.textlength(name, font=ft) <= W - 120:
            break
    d.text((60, H - 360), name, font=ft, fill=GOLD)
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
segs.append(("card", card("NiV CRÉATION", "Verre, cristal et acier gravés").convert("RGB"), None, INTRO_DUR))
ZW, ZH = int(W * 1.18), int(H * 1.18)
for f, name, sub in P:
    src = dl(f); im = Image.open(src).convert("RGB"); zi = cover(im, ZW, ZH)
    ov = overlay(name, sub)
    segs.append(("prod", zi, ov, SEG_DUR))
segs.append(("card", card("nivcreation.fr", "Personnalisez le vôtre", "Gravé & fabriqué en France").convert("RGB"), None, OUTRO_DUR))

# rendu vidéo (silencieux : aucune piste audio)
wri = imageio.get_writer(f"{OUT}/produits_graves.mp4", fps=FPS, codec="libx264", quality=8,
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
subprocess.run([FF, "-y", "-i", f"{OUT}/produits_graves.mp4",
    "-vf", "scale=720:1280", "-c:v", "libx264", "-profile:v", "main", "-pix_fmt", "yuv420p",
    "-crf", "26", "-preset", "medium", "-an", "-movflags", "+faststart",
    f"{OUT}/niv-produits-graves.mp4"],
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
print("DUREE %.1fs" % total, "| taille", os.path.getsize(f"{OUT}/niv-produits-graves.mp4"))
