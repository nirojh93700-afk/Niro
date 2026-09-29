# -*- coding: utf-8 -*-
# VIDÉO PUB SILENCIEUSE — bijoux gravés + blocs de cristal 3D, demande du gérant,
# 29/09/2026 : « une autre vidéo des bijoux et des cristal, bloc de cristal ».
# Verticale 1080x1920, sans son (comme les vidéos 10-13, 16-18).
#
# RÈGLE : uniquement des photos où la gravure/le cristal 3D est VISIBLE. Bijoux repris
# parmi les 10 photos vérifiées gravées de la vidéo 17 (planche contact du 28/09).
# Cristal : planche contact du 29/09 sur public/produits — les 2 photos « bloc-creme »
# sont des blocs VIERGES (à écarter) ; cristal-v-bebe écartée (photo floue, connu) ; les
# 2 « poster » vidéo écartés (doublons d'autres photos). 9 photos montrent une vraie
# gravure 3D lisible, 7 reprises ici pour varier avec les bijoux.
NUM = 19
NOM = "bijoux-cristal"
THEME = "Bijoux gravés & Cristal Photo 3D"

import os, sys, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import imageio_ffmpeg, imageio

OUT = "/tmp/claude-0/-home-user-Niro/8c34bee5-87e4-524d-be1e-7cc50fe3894e/scratchpad/videos"
os.makedirs(OUT, exist_ok=True)
FF = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 1080, 1920, 30
GOLD = (201, 162, 75); CREAM = (250, 246, 238); INK = (30, 26, 22); WHITE = (255, 255, 255)
INK2 = (46, 40, 33)
SERIFB = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
SANS = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
SANSB = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
SANSB_U = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"  # glyphe ✦
def F(p, s): return ImageFont.truetype(p, s)
SRC = os.path.join(os.path.dirname(__file__), "..", "..", "public", "produits")

RUBAN = "✦  BIJOUX & CRISTAL GRAVÉS  ✦"
PASTILLE = "GRAVÉ"
ACCROCHE = "Un prénom sur un bijou, une photo dans le cristal — gravés pour eux"

# (fichier, nom du produit, légende) — alterné bijou / cristal pour le rythme.
PRODUITS = [
    ('collier-coeur-grave-1.jpg', 'Collier Cœur à graver', 'Recto-verso, initiales et date'),
    ('cristal-h-amis.jpg', 'Cristal Photo 3D — Horizontal', 'Votre photo gravée en 3D dans le cristal'),
    ('collier-coeur-plaques-1.jpg', 'Collier Cœur & 2 plaques', 'Deux prénoms, une date'),
    ('cristal-v-femme.jpg', 'Cristal Photo 3D — Vertical', 'Un portrait, gravé pour toujours'),
    ('collier-3coeurs-3.jpg', 'Collier 3 Cœurs entrelacés', 'Un prénom gravé au cœur'),
    ('cristal-h-couple.jpg', 'Cristal Photo 3D — Horizontal', 'Un souvenir à deux, dans le cristal'),
    ('collier-double-coeur-3.jpg', 'Collier Double Cœur', 'Vos initiales et votre date'),
    ('cristal-v-enfant-chat.jpg', 'Cristal Photo 3D — Vertical', '« Amour inconditionnel »'),
    ('bracelet-cordon-plaque-4.jpg', 'Bracelet cordon à plaque', 'Vos initiales sur la plaque'),
    ('cristal-v-enfant-chien.jpg', 'Cristal Photo 3D — Vertical', 'Un compagnon, gravé en 3D'),
    ('bracelet-femme-acier-grave.jpg', 'Bracelet Femme Acier', 'Un mot gravé au poignet'),
    ('cristal-h-famille.jpg', 'Cristal Photo 3D — Horizontal', '« Toujours ensemble »'),
    ('collier-double-coeur-5.jpg', 'Collier Double Cœur', 'Deux prénoms, un seul cœur'),
    ('cristal-v-jeunes.jpg', 'Cristal Photo 3D — Vertical', 'Toute une bande, gravée en 3D'),
]

SEG_DUR, INTRO_DUR, OUTRO_DUR = 2.2, 1.9, 2.4

def fond_flou(im):
    """Photo entière, fond = la même photo zoomée et floutée. Centrée dans la zone
    SÛRE de TikTok/Insta, même recette que les vidéos 16-18."""
    iw, ih = im.size
    s = max(W / iw, H / ih); bg = im.resize((int(iw * s) + 1, int(ih * s) + 1), Image.LANCZOS)
    bx, by = (bg.width - W) // 2, (bg.height - H) // 2
    bg = bg.crop((bx, by, bx + W, by + H)).filter(ImageFilter.GaussianBlur(28))
    bg = Image.blend(bg, Image.new("RGB", (W, H), (20, 16, 12)), 0.35)
    s2 = min((W - 80) / iw, (H * 0.42) / ih); fg = im.resize((int(iw * s2), int(ih * s2)), Image.LANCZOS)
    bg.paste(fg, ((W - fg.width) // 2, int(H * 0.44) - fg.height // 2))
    return bg

def wrap(d, t, f, mw):
    o = []; c = ""
    for w in t.split():
        tt = (c + " " + w).strip()
        if d.textlength(tt, font=f) <= mw: c = tt
        else: o.append(c); c = w
    if c: o.append(c)
    return o

TOP_SAFE = 210
BOTTOM_SAFE = H - 460

def overlay(name, sub):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    band = Image.new("L", (1, H), 0); p = band.load()
    for y in range(H): p[0, y] = int(215 * max(0, (y - 1000) / (H - 1000)) ** 1.15)
    dark = Image.new("RGBA", (W, H), (15, 12, 9, 255)); dark.putalpha(band.resize((W, H)))
    im = Image.alpha_composite(im, dark); d = ImageDraw.Draw(im)

    fS = F(SANS, 34)
    lignes = wrap(d, sub, fS, W - 120)
    y_sub_bottom = BOTTOM_SAFE
    y_sub_top = y_sub_bottom - len(lignes) * 44

    ft = F(SERIFB, 58)
    for taille in range(58, 40, -2):
        ft = F(SERIFB, taille)
        if d.textlength(name, font=ft) <= W - 120: break
    y_name = y_sub_top - 12 - 68

    fp = F(SANSB, 26); wp = d.textlength(PASTILLE, font=fp)
    y_pastille = y_name - 10 - 42

    d.rounded_rectangle([60, y_pastille, 60 + wp + 36, y_pastille + 42], radius=21, fill=INK2 + (255,))
    d.text((78, y_pastille + 6), PASTILLE, font=fp, fill=GOLD)
    d.text((60, y_name), name, font=ft, fill=GOLD)
    yy = y_sub_top
    for ln in lignes:
        d.text((60, yy), ln, font=fS, fill=WHITE); yy += 44

    fr = F(SANSB_U, 32); wr = d.textlength(RUBAN, font=fr); ph = 84
    d.rectangle([0, TOP_SAFE - ph, W, TOP_SAFE], fill=INK + (255,))
    d.rectangle([0, TOP_SAFE, W, TOP_SAFE + 6], fill=GOLD + (255,))
    d.text(((W - wr) // 2, TOP_SAFE - ph + (ph - 34) // 2 - 4), RUBAN, font=fr, fill=GOLD)
    return im

def card(big, small, big2=None, haut=None, ink_bg=False):
    im = Image.new("RGB", (W, H), INK if ink_bg else CREAM); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 14], fill=GOLD); d.rectangle([0, H - 14, W, H], fill=GOLD)
    if haut:
        fh = F(SANSB_U, 38); wh = d.textlength(haut, font=fh)
        d.text(((W - wh) // 2, H // 2 - 300), haut, font=fh, fill=GOLD if ink_bg else (120, 100, 60))
    fB = F(SERIFB, 100)
    for taille in range(100, 60, -4):
        fB = F(SERIFB, taille)
        if d.textlength(big, font=fB) <= W - 100: break
    wb = d.textlength(big, font=fB); d.text(((W - wb) // 2, H // 2 - 160), big, font=fB, fill=GOLD)
    fS = F(SANS, 50)
    y = H // 2 - 20
    for ln in wrap(d, small, fS, W - 140):
        ws = d.textlength(ln, font=fS)
        d.text(((W - ws) // 2, y), ln, font=fS, fill=(245, 238, 222) if ink_bg else INK); y += 62
    if big2:
        f2 = F(SANSB, 44); w2 = d.textlength(big2, font=f2)
        d.text(((W - w2) // 2, y + 20), big2, font=f2, fill=GOLD)
    return im

def rendre():
    segs = [("card", card("Gravé pour eux", ACCROCHE, "NiV CRÉATION", haut=RUBAN, ink_bg=True), None, INTRO_DUR + 0.4)]
    for f, name, sub in PRODUITS:
        im = Image.open(os.path.join(SRC, f)).convert("RGB")
        base = fond_flou(im)
        ZW, ZH = int(W * 1.12), int(H * 1.12)
        segs.append(("prod", base.resize((ZW, ZH), Image.LANCZOS), overlay(name, sub), SEG_DUR))
    segs.append(("card", card("Un cadeau qui leur ressemble", "Chaque pièce est personnalisée, gravée à la commande",
                               "nivcreation.fr  ·  Gravé en France", haut=RUBAN, ink_bg=True), None, OUTRO_DUR))
    brut = f"{OUT}/{NOM}-brut.mp4"; final = f"{OUT}/niv-{NOM}.mp4"
    wri = imageio.get_writer(brut, fps=FPS, codec="libx264", quality=8, macro_block_size=1,
                             ffmpeg_params=["-pix_fmt", "yuv420p"], ffmpeg_log_level="error")
    cream = Image.new("RGB", (W, H), CREAM); mi = None
    for kind, img, ov, dur in segs:
        nf = max(1, int(round(dur * FPS)))
        for fi in range(nf):
            prog = fi / max(1, nf - 1)
            if kind == "card": frame = img.convert("RGBA")
            else:
                z = 1.12 - 0.12 * prog
                cw, ch = int(W * z), int(H * z); x = (img.size[0] - cw) // 2; y = (img.size[1] - ch) // 2
                frame = Image.alpha_composite(img.crop((x, y, x + cw, y + ch)).resize((W, H), Image.LANCZOS).convert("RGBA"), ov)
            frame = frame.convert("RGB")
            FA = int(0.16 * FPS); a = 1.0
            if fi < FA: a = fi / FA
            elif fi > nf - FA: a = max(0, (nf - fi) / FA)
            if a < 1.0: frame = Image.blend(cream, frame, a)
            if kind == "prod" and fi == nf // 2 and mi is None: mi = frame.copy()
            wri.append_data(np.asarray(frame))
    wri.close()
    subprocess.run([FF, "-y", "-i", brut, "-vf", "scale=720:1280", "-c:v", "libx264", "-profile:v", "main",
                    "-pix_fmt", "yuv420p", "-crf", "26", "-preset", "medium", "-an", "-movflags", "+faststart", final],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    os.remove(brut)
    mi.resize((360, 640)).save(f"{OUT}/apercu-{NOM}.jpg", quality=80)
    print(f"Vidéo {NUM} — {THEME} : {sum(s[3] for s in segs):.1f} s, {os.path.getsize(final)//1024} Ko → {final}")

rendre()
